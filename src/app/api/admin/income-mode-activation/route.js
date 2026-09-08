import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const incomeModeActivationSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  provider: z.string().trim().max(100).optional(),
  number: z.string().trim().min(1).max(30),
  amount: z.number().int().positive(),
  button_text: z.string().trim().min(1).max(200),
});

const defaults = {
  enabled: true,
  title: "Income Mode চালু করুন",
  message:
    "এই নম্বরে ১০০ টাকা Send Money করে Income Mode চালু করুন এবং ইনকাম করুন।",
  provider: "bKash",
  number: "017XXXXXXXX",
  amount: 100,
  button_text: "Income Mode চালু করুন",
};

/**
 * Public GET
 *
 * Normal users need to read this configuration so the
 * activation modal can display the admin-configured information.
 */
export async function GET() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("admin_settings")
    .select("key, value")
    .eq("key", "income_mode_activation")
    .maybeSingle();

  if (error) {
    console.error("[income-mode-activation] GET error", error);

    return NextResponse.json(
      { error: "Could not load activation configuration" },
      { status: 500 }
    );
  }

  let config = { ...defaults };

  if (data?.value) {
    const parsed = incomeModeActivationSchema.safeParse(data.value);

    if (parsed.success) {
      config = {
        ...defaults,
        ...parsed.data,
      };
    }
  }

  return NextResponse.json(
    { config },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

/**
 * Admin-only update
 */
export async function PUT(request) {

  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const parsed = incomeModeActivationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ||
          "Invalid activation configuration",
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("admin_settings")
    .upsert(
      {
        key: "income_mode_activation",
        value: parsed.data,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      }
    )
    .select("key, value")
    .single();

  if (error) {
    console.error("[income-mode-activation] PUT error", error);

    return NextResponse.json(
      { error: "Could not save activation configuration" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    config: data?.value ?? parsed.data,
  });
}