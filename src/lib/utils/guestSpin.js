export async function claimGuestPrize() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("guestSpinPrize");
    if (!raw) return null;
    const prize = JSON.parse(raw);
    if (!prize || prize.claimed || !prize.code || !prize.amount || prize.amount <= 0) {
      return null;
    }
    const res = await fetch("/api/auth/claim-guest-spin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: prize.amount, code: prize.code }),
    });
    if (res.ok) {
      prize.claimed = true;
      window.localStorage.setItem("guestSpinPrize", JSON.stringify(prize));
      return prize.amount;
    }
  } catch {
    // prize stays in localStorage for a later attempt
  }
  return null;
}