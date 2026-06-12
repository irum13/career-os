import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; connected?: string }>;
}) {
  const { error, message, connected } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: accounts } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", user!.id);

  const gmail = accounts?.find((a) => a.provider === "gmail");
  const outlook = accounts?.find((a) => a.provider === "outlook");

  return (
    <div>
      <Header
        title="Sources"
        subtitle="Gmail and Outlook (inbox, promotions, updates, social, junk) — read-only"
      />

      <div className="grid max-w-2xl gap-4">
        {connected === "outlook" && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            Outlook connected successfully.
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            Connection failed ({error}).{" "}
            {message || "Check that MICROSOFT_TENANT_ID is set in .env.local for UH single-tenant apps."}
          </p>
        )}
        <Card title="Gmail">
          {gmail ? (
            <div className="space-y-2 text-sm">
              <p className="text-slate-700">{gmail.email}</p>
              <div className="flex flex-wrap gap-2">
                {gmail.scan_inbox && <Badge label="inbox" />}
                {gmail.scan_promotions && <Badge label="promotions" />}
                {gmail.scan_junk && <Badge label="junk" />}
                <Badge label="updates" />
                <Badge label="social" />
              </div>
              {gmail.last_sync_at && (
                <p className="text-[var(--muted)]">Last sync: {formatDateTime(gmail.last_sync_at)}</p>
              )}
            </div>
          ) : (
            <Link
              href="/api/auth/gmail"
              className="inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              Connect Gmail
            </Link>
          )}
        </Card>

        <Card title="Outlook">
          {outlook ? (
            <div className="space-y-2 text-sm">
              <p className="text-slate-700">{outlook.email}</p>
              <div className="flex flex-wrap gap-2">
                {outlook.scan_inbox && <Badge label="inbox" />}
                {outlook.scan_promotions && <Badge label="promotions" />}
                {outlook.scan_junk && <Badge label="junk" />}
              </div>
              {outlook.last_sync_at && (
                <p className="text-[var(--muted)]">Last sync: {formatDateTime(outlook.last_sync_at)}</p>
              )}
            </div>
          ) : (
            <Link
              href="/api/auth/outlook"
              className="inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              Connect Outlook
            </Link>
          )}
        </Card>

        <Card title="Newsletter sources">
          <p className="text-sm text-[var(--muted)]">
            Curate AI and tech newsletter senders on the{" "}
            <Link href="/news" className="text-[var(--accent)] hover:underline">
              News page
            </Link>
            . This page is for connecting mail accounts only.
          </p>
        </Card>
      </div>
    </div>
  );
}
