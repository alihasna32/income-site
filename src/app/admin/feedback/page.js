import { PageHeader } from "@/components/shared/PageHeader";
import { BackButton } from "@/components/shared/BackButton";
import { FeedbackManager } from "@/components/admin/FeedbackManager";

export const metadata = {
  title: "Feedback",
};

export default function AdminFeedbackPage() {
  return (
    <div className="space-y-6">
      <BackButton fallback="/admin" />
      <PageHeader
        title="Community Feedback"
        description="Create and manage announcements shown to all users on the dashboard."
      />
      <FeedbackManager />
    </div>
  );
}
