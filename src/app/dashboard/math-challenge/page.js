import { MathChallengeGame } from "@/components/games/MathChallengeGame";
import { BackButton } from "@/components/shared/BackButton";

export const metadata = {
  title: "Math Challenge",
};

export default function MathChallengePage() {
  return (
    <div className="space-y-4">
      <BackButton fallback="/dashboard/games" />
      <MathChallengeGame />
    </div>
  );
}