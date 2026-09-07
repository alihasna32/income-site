import { PageHeader } from "@/components/shared/PageHeader";
import { AdminTakaWithdrawalsTable } from "@/components/admin/AdminTakaWithdrawalsTable";
import { BackButton } from "@/components/shared/BackButton";

export const metadata = {
  title: "Taka Withdrawals",
};

export default function AdminTakaWithdrawalsPage() {
  return (
    <div className="space-y-6">
      <BackButton fallback="/admin" />
      <PageHeader
        title="Taka withdrawal requests"
        description="Review Taka payout requests. Taka is deducted from users' Taka balance when they submit a request. Approve to confirm or reject to refund the balance."
      />
      <AdminTakaWithdrawalsTable />
    </div>
  );
}
