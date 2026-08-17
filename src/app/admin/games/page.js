import { PageHeader } from "@/components/shared/PageHeader";
import { BackButton } from "@/components/shared/BackButton";
import { GamesTable } from "@/components/admin/GamesTable";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Games",
};

export default async function AdminGamesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("games")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <BackButton fallback="/admin" />
      <PageHeader
        title="Games"
        description="Pause games or tune rewards. Changes apply instantly."
      />
      <GamesTable initialGames={data || []} />
    </div>
  );
}