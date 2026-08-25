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
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <BackButton fallback="/admin" />
      <PageHeader title="Income Mode Requests" description="Review and manage Income Mode activation requests." />
      <IncomeRequestsTable initialData={data || []} />
    </div>
  );
}
