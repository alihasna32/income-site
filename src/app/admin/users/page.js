import { PageHeader } from "@/components/shared/PageHeader";
import { BackButton } from "@/components/shared/BackButton";
import { UsersTable } from "@/components/admin/UsersTable";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Users",
};

export default async function AdminUsersPage() {
  const admin = createAdminClient();
  const { data, count } = await admin
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      <BackButton fallback="/admin" />
      <PageHeader
        title="Users"
        description="Manage roles and keep the community fair."
      />
      <UsersTable initialUsers={data || []} totalCount={count || 0} />
    </div>
  );
}