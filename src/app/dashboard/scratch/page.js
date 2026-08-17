import { ScratchCardGame } from "@/components/rewards/ScratchCardGame";
import { BackButton } from "@/components/shared/BackButton";

export const metadata = {
  title: "Scratch Cards",
};

export default function ScratchPage() {
  return (
    <div className="space-y-4">
      <BackButton fallback="/dashboard/games" />
      <ScratchCardGame />
    </div>
  );
}