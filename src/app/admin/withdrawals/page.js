import { PageHeader } from "@/components/shared/PageHeader";
import { AdminWithdrawalsTable } from "@/components/admin/AdminWithdrawalsTable";
import { BackButton } from "@/components/shared/BackButton";

export const metadata = {
  title: "Withdrawals",
};

export default function AdminWithdrawalsPage() {
  return (
    <div className="space-y-6">
      <BackButton fallback="/admin" />
      <PageHeader
        title="Withdrawal requests"
        description="Review pending payout requests. Approving deducts coins from the user's wallet."
      />
      <AdminWithdrawalsTable />
    </div>
  );
}