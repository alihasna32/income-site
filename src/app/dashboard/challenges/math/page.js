import DailyMathChallenge from "@/components/math/DailyMathChallenge";
import { BackButton } from "@/components/shared/BackButton";

export const metadata = {
  title: "Daily Math Challenge",
};

export default function DailyMathPage() {
  return (
    <div className="space-y-4">
      <BackButton fallback="/dashboard/challenges" />
      <DailyMathChallenge />
    </div>
  );
}