import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { updateProfile, addSenderBlocklist } from "@/app/actions";
import { FormField, SubmitButton } from "@/components/forms/SimpleForm";
import { ManualSyncButton } from "@/components/ManualSyncButton";
import { BlocklistManager } from "@/components/BlocklistManager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: blocklist } = await supabase
    .from("sender_blocklist")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Header title="Settings" subtitle="Profile and preferences" />

      <div className="max-w-xl space-y-6">
        <Card title="Profile">
          <form action={updateProfile} className="space-y-3">
            <FormField label="Full name" name="full_name" defaultValue={profile?.full_name ?? ""} />
            <FormField label="Location" name="location" defaultValue={profile?.location ?? "Houston, TX"} />
            <FormField label="School" name="school" defaultValue={profile?.school ?? "University of Houston (UH)"} />
            <FormField label="Program" name="program" defaultValue={profile?.program ?? "Engineering Data Science"} />
            <FormField label="Career focus" name="career_focus" type="textarea" defaultValue={profile?.career_focus ?? ""} />
            <SubmitButton label="Save profile" />
          </form>
        </Card>

        <Card title="Blocked senders">
          <p className="mb-4 text-sm text-[var(--muted)]">
            Future mail from these senders is auto-hidden. Gmail is not affected.
          </p>
          <form action={addSenderBlocklist} className="mb-4 space-y-3">
            <FormField
              label="Email, domain, or company name"
              name="pattern"
              required
              placeholder="e.g. linkedin.com, jobalerts-noreply@linkedin.com, McKinsey"
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Match type</label>
              <select
                name="match_type"
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">Auto-detect</option>
                <option value="email">Exact email</option>
                <option value="domain">Domain (@linkedin.com)</option>
                <option value="contains">Contains (company name)</option>
              </select>
            </div>
            <SubmitButton label="Block sender" />
          </form>
          <BlocklistManager entries={blocklist ?? []} />
        </Card>

        <Card title="Mail sync">
          <p className="mb-4 text-sm text-[var(--muted)]">
            Sync pulls mail from Gmail and Outlook. News sources get full-body reads for AI briefs on
            the News page.
          </p>
          <ManualSyncButton />
        </Card>
      </div>
    </div>
  );
}
