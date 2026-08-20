import { Suspense } from "react";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSession } from "@/lib/auth/session";

export const metadata = {
  title: "Create account",
  description: "Join CoinQuest free — play games, complete challenges and earn virtual rewards.",
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const user = await getSession();
  if (user) redirect("/dashboard");

  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}