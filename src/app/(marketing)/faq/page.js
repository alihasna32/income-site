import { FaqSection } from "@/components/marketing/FaqSection";

export const metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about CoinQuest — free play, virtual rewards, streaks, referrals and fair play.",
};

export default function FaqPage() {
  return (
    <div className="py-10 sm:py-14">
      <div className="container-page">
        <FaqSection />
      </div>
    </div>
  );
}