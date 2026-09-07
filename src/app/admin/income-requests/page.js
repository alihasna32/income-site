import { PageHeader } from "@/components/shared/PageHeader";
import { BackButton } from "@/components/shared/BackButton";
import { IncomeRequestsTable } from "@/components/admin/IncomeRequestsTable";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Income Mode Requests",
};

export default async function Page() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("income_requests")
    .select("id,user_id,name,phone,transaction_id,status,admin_id,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  // Attach each user's current income_mode_status so the table can reflect
  // admin enable/disable actions even when the request's own status doesn't change.
  const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id,income_mode_status").in("id", userIds)
    : { data: [] };
  const profileMap = Object.fromEntries(
    (profiles || []).map((p) => [p.id, p.income_mode_status || "disabled"])
  );
  const initialData = (data || []).map((row) => ({
    ...row,
    income_mode_status: profileMap[row.user_id] || "disabled",
  }));

  return (
    <div className="space-y-6">
      <BackButton fallback="/admin" />
      <PageHeader title="Income Mode Requests" description="Review and manage Income Mode activation requests." />
      <IncomeRequestsTable initialData={initialData} />
    </div>
  );
}
