import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { creditReward } from "@/lib/rewards/credit";
import { WITHDRAWAL_METHODS } from "@/lib/constants/withdrawals";

const DEFAULT_MIN_AMOUNT = 1000;
const MAX_AMOUNT = 1000000;

async function getSettings() {
  if (!supabaseReady()) throw new Error("Supabase not configured");
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_settings")
    .select("value")
    .eq("key", "withdrawals")
    .maybeSingle();
  return {
    minAmount: Number(data?.value?.min_amount ?? DEFAULT_MIN_AMOUNT),
  };
}

async function getWallet(admin, userId) {
  const { data } = await admin
    .from("wallets")
    .select("coins, total_earned, total_redeemed")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

function validateDetails(method, details) {
  const fields = WITHDRAWAL_METHODS[method]?.fields || [];
  const allowed = new Set(fields.map((f) => f.key));
  const clean = {};
  for (const field of fields) {
    const value = (details?.[field.key] || "").toString().trim();
    if (field.required && !value) {
      const err = new Error(`${field.label} is required`);
      err.code = "INVALID_DETAILS";
      throw err;
    }
    if (field.key === "number" && !/^01\d{9}$/.test(value)) {
      const err = new Error("Enter a valid 11-digit mobile number");
      err.code = "INVALID_DETAILS";
      throw err;
    }
    if (field.key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      const err = new Error("Enter a valid email address");
      err.code = "INVALID_DETAILS";
      throw err;
    }
    clean[field.key] = value;
  }
  for (const key of Object.keys(details || {})) {
    if (!allowed.has(key)) delete clean[key];
  }
  return clean;
}

export async function getWithdrawalSettings() {
  return getSettings();
}

export async function submitWithdrawal(userId, { amount, method, details }) {
  const settings = await getSettings();
  const admin = createAdminClient();

  if (!Number.isInteger(amount) || amount < settings.minAmount) {
    const err = new Error(`Minimum withdrawal is ${settings.minAmount} coins`);
    err.code = "BELOW_MINIMUM";
    throw err;
  }
  if (amount > MAX_AMOUNT) {
    const err = new Error("Withdrawal amount is too large");
    err.code = "INVALID_AMOUNT";
    throw err;
  }

  const wallet = await getWallet(admin, userId);
  if (!wallet || wallet.coins < amount) {
    const err = new Error("You don't have enough coins for this withdrawal");
    err.code = "INSUFFICIENT_BALANCE";
    throw err;
  }

  const { data: pending } = await admin
    .from("withdrawals")
    .select("id, created_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();
  if (pending) {
    const err = new Error("You already have a pending withdrawal");
    err.code = "PENDING_WITHDRAWAL_EXISTS";
    throw err;
  }

  const cleanDetails = validateDetails(method, details);

  const { data: withdrawal, error: wError } = await admin
    .from("withdrawals")
    .insert({
      user_id: userId,
      amount,
      method,
      details: cleanDetails,
      status: "pending",
    })
    .select()
    .maybeSingle();
  if (wError) throw wError;

  // Hold the coins: negative tx in "pending" state, no balance change yet.
  const { error: tError } = await admin.from("wallet_transactions").insert({
    user_id: userId,
    type: "withdrawal",
    amount: -amount,
    status: "pending",
    description: `Withdrawal request (${WITHDRAWAL_METHODS[method].label})`,
    idempotency_key: `withdrawal-hold:${withdrawal.id}`,
    metadata: { withdrawal_id: withdrawal.id, method },
  });

  if (tError) {
    await admin.from("withdrawals").delete().eq("id", withdrawal.id);
    throw tError;
  }

  return withdrawal;
}

export async function approveWithdrawal(withdrawalId, adminId) {
  const admin = createAdminClient();

  const { data: withdrawal } = await admin
    .from("withdrawals")
    .select("*")
    .eq("id", withdrawalId)
    .maybeSingle();
  if (!withdrawal) {
    const err = new Error("Withdrawal not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (withdrawal.status !== "pending") {
    const err = new Error("This withdrawal is no longer pending");
    err.code = "NOT_PENDING";
    throw err;
  }

  const wallet = await getWallet(admin, withdrawal.user_id);
  if (!wallet || wallet.coins < withdrawal.amount) {
    const err = new Error("User no longer has enough coins");
    err.code = "INSUFFICIENT_BALANCE";
    throw err;
  }

  const credited = await creditReward({
    userId: withdrawal.user_id,
    type: "withdrawal",
    amount: -withdrawal.amount,
    xp: 0,
    description: `Withdrawal paid out`,
    idempotencyKey: `withdrawal:approve:${withdrawal.id}`,
    metadata: { withdrawal_id: withdrawal.id, method: withdrawal.method },
  });
  if (!credited) {
    const err = new Error("Could not process the withdrawal");
    err.code = "CREDIT_FAILED";
    throw err;
  }

  await admin
    .from("wallet_transactions")
    .update({ status: "completed" })
    .eq("metadata->>withdrawal_id", withdrawal.id)
    .eq("status", "pending");

  await admin
    .from("withdrawals")
    .update({
      status: "approved",
      processed_by: adminId,
      processed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId);

  await admin.from("notifications").insert({
    user_id: withdrawal.user_id,
    type: "system",
    title: "Withdrawal approved",
    message: `Your withdrawal of ${withdrawal.amount} coins has been approved and is being processed.`,
  });

  return { id: withdrawal.id, status: "approved" };
}

export async function rejectWithdrawal(withdrawalId, adminId, note = "") {
  const admin = createAdminClient();

  const { data: withdrawal } = await admin
    .from("withdrawals")
    .select("*")
    .eq("id", withdrawalId)
    .maybeSingle();
  if (!withdrawal) {
    const err = new Error("Withdrawal not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (withdrawal.status !== "pending") {
    const err = new Error("This withdrawal is no longer pending");
    err.code = "NOT_PENDING";
    throw err;
  }

  await admin
    .from("wallet_transactions")
    .update({ status: "failed" })
    .eq("metadata->>withdrawal_id", withdrawal.id)
    .eq("status", "pending");

  await admin
    .from("withdrawals")
    .update({
      status: "rejected",
      admin_note: note.slice(0, 500),
      processed_by: adminId,
      processed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId);

  await admin.from("notifications").insert({
    user_id: withdrawal.user_id,
    type: "system",
    title: "Withdrawal rejected",
    message: note
      ? `Your withdrawal of ${withdrawal.amount} coins was rejected: ${note}`
      : `Your withdrawal of ${withdrawal.amount} coins was rejected.`,
  });

  return { id: withdrawal.id, status: "rejected" };
}