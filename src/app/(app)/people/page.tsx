import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createContact } from "@/app/actions";
import { FormField, SubmitButton } from "@/components/forms/SimpleForm";
import { formatDate } from "@/lib/utils";

export default async function PeoplePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user!.id)
    .order("name");

  return (
    <div>
      <Header title="People" subtitle="Referrals, networking contacts, and coffee chat prep" />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {contacts && contacts.length > 0 ? (
            contacts.map((c) => (
              <Card key={c.id} className="!p-4">
                <h3 className="font-medium text-slate-900">{c.name}</h3>
                {c.email && <p className="text-sm text-[var(--muted)]">{c.email}</p>}
                {c.context && <p className="mt-1 text-sm text-slate-600">{c.context}</p>}
                {c.follow_up_date && (
                  <p className="mt-1 text-sm text-amber-600">Follow up {formatDate(c.follow_up_date)}</p>
                )}
                {c.chat_questions && (
                  <div className="mt-2 rounded bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">Coffee chat questions</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{c.chat_questions}</p>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <EmptyState title="No contacts yet" description="Add people you want to network with." />
          )}
        </div>

        <Card title="Add contact">
          <form action={createContact} className="space-y-3">
            <FormField label="Name" name="name" required />
            <FormField label="Email" name="email" type="email" />
            <FormField label="Context" name="context" placeholder="Referral from X, met at event..." />
            <FormField label="Follow-up date" name="follow_up_date" type="date" />
            <FormField label="Coffee chat questions" name="chat_questions" type="textarea" />
            <FormField label="Notes" name="notes" type="textarea" />
            <SubmitButton label="Add contact" />
          </form>
        </Card>
      </div>
    </div>
  );
}
