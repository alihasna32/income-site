import { PageHeader } from "@/components/shared/PageHeader";
import { BackButton } from "@/components/shared/BackButton";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const metadata = {
  title: "Settings",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <BackButton fallback="/admin" />
      <PageHeader
        title="Platform settings"
        description="Referral bonuses, withdrawals, daily math, streak grace, math economy and branding."
      />
      <SettingsForm />
    </div>
  );
}