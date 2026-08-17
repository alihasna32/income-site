import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log in",
  description: "Log in to CoinQuest and pick up your streak.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}