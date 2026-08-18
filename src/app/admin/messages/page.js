import { ContactMessagesTable } from "@/components/admin/ContactMessagesTable";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Contact Messages",
};

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const admin = createAdminClient();

  const [{ data: messages }, { count: total }, { count: newCount }] = await Promise.all([
    admin
      .from("contact_messages")
      .select("*, profiles(display_name, avatar_emoji)")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("contact_messages").select("id", { count: "exact", head: true }),
    admin.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-plum">Contact messages</h1>
        <p className="mt-1 text-sm text-muted">
          Messages from the contact form. Reply to them and update their status as you go.
        </p>
      </div>
      <ContactMessagesTable initialMessages={messages || []} totalCount={total || 0} initialNewCount={newCount || 0} />
    </div>
  );
}