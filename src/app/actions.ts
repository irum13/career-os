"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { draftActionContent } from "@/lib/gemini";
import type { CaptureType, ItemPriority } from "@/lib/types";
import { extractEmail, inferBlocklistType } from "@/lib/mail/blocklist";
import type { BlocklistMatchType } from "@/lib/mail/blocklist";
import { inferSenderMatchType } from "@/lib/mail/sender-match";
import { generateNewsBrief } from "@/lib/news-brief";

function revalidateInbox() {
  revalidatePath("/inbox");
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/news");
  revalidatePath("/notifications");
}

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function quickCapture(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const type = formData.get("type") as CaptureType;
  const title = (formData.get("title") as string)?.trim();
  const url = (formData.get("url") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!title) throw new Error("Title is required");

  if (type === "link" || type === "idea") {
    await supabase.from("items").insert({
      user_id: userId,
      source_type: "manual",
      title,
      url,
      summary: notes,
      category: type === "idea" ? "other" : "other",
    });
  } else if (type === "job") {
    const { data: job } = await supabase
      .from("job_applications")
      .insert({ user_id: userId, company: title, role: notes || "Role TBD", url, status: "interested" })
      .select()
      .single();
    if (formData.get("due_date") && job) {
      await supabase.from("deadlines").insert({
        user_id: userId,
        title: `Apply: ${title}`,
        due_date: formData.get("due_date") as string,
        entity_type: "job",
        entity_id: job.id,
      });
    }
  } else if (type === "scholarship") {
    await supabase.from("scholarships").insert({
      user_id: userId,
      name: title,
      url,
      notes,
      status: "interested",
    });
  } else if (type === "deadline") {
    await supabase.from("deadlines").insert({
      user_id: userId,
      title,
      due_date: formData.get("due_date") as string,
      notes,
      entity_type: "work",
    });
  }

  revalidatePath("/");
  revalidatePath("/inbox");
}

export async function setItemPriority(itemId: string, priority: ItemPriority) {
  const { supabase, userId } = await getUserId();
  await supabase.from("items").update({ priority }).eq("id", itemId).eq("user_id", userId);
  revalidateInbox();
}

export async function bulkDismissItems(itemIds: string[]) {
  if (!itemIds.length) return;
  const { supabase, userId } = await getUserId();
  await supabase
    .from("items")
    .update({ priority: "dismissed" })
    .eq("user_id", userId)
    .in("id", itemIds);
  revalidateInbox();
}

export async function bulkSetPriority(itemIds: string[], priority: ItemPriority) {
  if (!itemIds.length) return;
  const { supabase, userId } = await getUserId();
  await supabase
    .from("items")
    .update({ priority })
    .eq("user_id", userId)
    .in("id", itemIds);
  revalidateInbox();
}

export async function dismissAllFromSender(sender: string, blockFuture = false) {
  const { supabase, userId } = await getUserId();
  const email = extractEmail(sender);

  if (email) {
    await supabase
      .from("items")
      .update({ priority: "dismissed" })
      .eq("user_id", userId)
      .ilike("sender", `%${email}%`);
  } else {
    await supabase
      .from("items")
      .update({ priority: "dismissed" })
      .eq("user_id", userId)
      .eq("sender", sender);
  }

  if (blockFuture) {
    const pattern = email ?? sender;
    const match_type = inferBlocklistType(pattern);
    await supabase.from("sender_blocklist").upsert(
      {
        user_id: userId,
        pattern: pattern.toLowerCase(),
        match_type,
        label: sender.slice(0, 80),
      },
      { onConflict: "user_id,pattern,match_type" }
    );
  }

  revalidateInbox();
}

export async function addSenderBlocklist(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const pattern = (formData.get("pattern") as string)?.trim();
  if (!pattern) return;

  const rawType = formData.get("match_type") as string;
  const matchType: BlocklistMatchType =
    rawType === "email" || rawType === "domain" || rawType === "contains"
      ? rawType
      : inferBlocklistType(pattern);

  await supabase.from("sender_blocklist").upsert(
    {
      user_id: userId,
      pattern: pattern.toLowerCase(),
      match_type: matchType,
      label: (formData.get("label") as string) || pattern,
    },
    { onConflict: "user_id,pattern,match_type" }
  );

  // Hide existing matching items
  const { data: items } = await supabase
    .from("items")
    .select("id, sender")
    .eq("user_id", userId)
    .neq("priority", "dismissed");

  const { senderMatchesBlocklist } = await import("@/lib/mail/blocklist");
  const entry = { pattern: pattern.toLowerCase(), match_type: matchType };
  const toDismiss = (items ?? [])
    .filter((i) => senderMatchesBlocklist(i.sender, [entry]))
    .map((i) => i.id);

  if (toDismiss.length) {
    await supabase.from("items").update({ priority: "dismissed" }).in("id", toDismiss);
  }

  revalidateInbox();
}

export async function removeSenderBlocklist(id: string) {
  const { supabase, userId } = await getUserId();
  await supabase.from("sender_blocklist").delete().eq("id", id).eq("user_id", userId);
  revalidateInbox();
}

export async function promoteItem(itemId: string, target: "job" | "scholarship") {
  const { supabase, userId } = await getUserId();
  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .single();

  if (!item) return;

  if (target === "job") {
    await supabase.from("job_applications").insert({
      user_id: userId,
      company: item.sender || "Unknown",
      role: item.title,
      url: item.url,
      status: "interested",
    });
  } else {
    await supabase.from("scholarships").insert({
      user_id: userId,
      name: item.title,
      url: item.url,
      status: "interested",
    });
  }

  await supabase.from("items").update({ priority: "high" }).eq("id", itemId);
  revalidatePath("/inbox");
  revalidatePath("/jobs");
  revalidatePath("/scholarships");
}

export async function createJob(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { data: job } = await supabase
    .from("job_applications")
    .insert({
      user_id: userId,
      company: formData.get("company") as string,
      role: formData.get("role") as string,
      url: (formData.get("url") as string) || null,
      status: (formData.get("status") as string) || "interested",
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  const dueDate = formData.get("due_date") as string;
  if (dueDate && job) {
    await supabase.from("deadlines").insert({
      user_id: userId,
      title: `Apply: ${job.company} — ${job.role}`,
      due_date: dueDate,
      entity_type: "job",
      entity_id: job.id,
    });
  }
  revalidatePath("/jobs");
}

export async function createScholarship(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { data: scholarship } = await supabase
    .from("scholarships")
    .insert({
      user_id: userId,
      name: formData.get("name") as string,
      organization: (formData.get("organization") as string) || null,
      url: (formData.get("url") as string) || null,
      amount: (formData.get("amount") as string) || null,
      status: "interested",
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  const dueDate = formData.get("due_date") as string;
  if (dueDate && scholarship) {
    await supabase.from("deadlines").insert({
      user_id: userId,
      title: `Apply: ${scholarship.name}`,
      due_date: dueDate,
      entity_type: "scholarship",
      entity_id: scholarship.id,
    });
  }
  revalidatePath("/scholarships");
}

export async function createDeadline(formData: FormData) {
  const { supabase, userId } = await getUserId();
  await supabase.from("deadlines").insert({
    user_id: userId,
    title: formData.get("title") as string,
    due_date: formData.get("due_date") as string,
    entity_type: "work",
    notes: (formData.get("notes") as string) || null,
    notice_days: [7, 3, 1],
  });
  revalidatePath("/work");
}

export async function createSubscription(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const renewal = (formData.get("renewal_date") as string) || null;
  const { data: sub } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      name: formData.get("name") as string,
      amount: formData.get("amount") ? parseFloat(formData.get("amount") as string) : null,
      renewal_date: renewal,
      cancel_url: (formData.get("cancel_url") as string) || null,
    })
    .select()
    .single();

  if (renewal && sub) {
    await supabase.from("deadlines").insert({
      user_id: userId,
      title: `Renew: ${sub.name}`,
      due_date: renewal,
      entity_type: "subscription",
      entity_id: sub.id,
    });
  }
  revalidatePath("/money");
}

export async function createContact(formData: FormData) {
  const { supabase, userId } = await getUserId();
  await supabase.from("contacts").insert({
    user_id: userId,
    name: formData.get("name") as string,
    email: (formData.get("email") as string) || null,
    context: (formData.get("context") as string) || null,
    follow_up_date: (formData.get("follow_up_date") as string) || null,
    chat_questions: (formData.get("chat_questions") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath("/people");
}

export async function createActionRequest(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const requestText = formData.get("request_text") as string;
  const title = formData.get("title") as string;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  const draft = await draftActionContent(requestText, profile);

  await supabase.from("action_requests").insert({
    user_id: userId,
    action_type: "draft_application",
    title,
    request_text: requestText,
    draft_content: draft,
    status: "pending_approval",
  });
  revalidatePath("/actions");
}

export async function updateActionStatus(actionId: string, status: "approved" | "cancelled" | "executed") {
  const { supabase, userId } = await getUserId();
  await supabase
    .from("action_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", actionId)
    .eq("user_id", userId);
  revalidatePath("/actions");
}

export async function updateProfile(formData: FormData) {
  const { supabase, userId } = await getUserId();
  const { data: existing } = await supabase.from("profiles").select("*").eq("id", userId).single();
  await supabase
    .from("profiles")
    .update({
      full_name: (formData.get("full_name") as string) || existing?.full_name,
      location: (formData.get("location") as string) || existing?.location,
      school: (formData.get("school") as string) || existing?.school,
      program: (formData.get("program") as string) || existing?.program,
      career_focus: (formData.get("career_focus") as string) || existing?.career_focus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  revalidatePath("/settings");
}

export async function addNewsSource(sender: string, label?: string) {
  const { supabase, userId } = await getUserId();
  const email = extractEmail(sender);
  const pattern = (email ?? sender).toLowerCase().trim();
  if (!pattern) return;

  const match_type = inferSenderMatchType(pattern);
  await supabase.from("news_sources").upsert(
    {
      user_id: userId,
      pattern,
      match_type,
      label: label || sender.slice(0, 80),
    },
    { onConflict: "user_id,pattern,match_type" }
  );
  revalidateInbox();
}

export async function addNewsSourceFromForm(formData: FormData) {
  const pattern = (formData.get("pattern") as string)?.trim();
  if (!pattern) return;

  const rawType = formData.get("match_type") as string;
  const matchType =
    rawType === "email" || rawType === "domain" || rawType === "contains"
      ? rawType
      : inferSenderMatchType(pattern);

  const { supabase, userId } = await getUserId();
  await supabase.from("news_sources").upsert(
    {
      user_id: userId,
      pattern: pattern.toLowerCase(),
      match_type: matchType,
      label: (formData.get("label") as string) || pattern,
    },
    { onConflict: "user_id,pattern,match_type" }
  );
  revalidateInbox();
}

export async function removeNewsSource(id: string) {
  const { supabase, userId } = await getUserId();
  await supabase.from("news_sources").delete().eq("id", id).eq("user_id", userId);
  revalidateInbox();
}

export async function generateNewsBriefAction() {
  const { userId } = await getUserId();
  await generateNewsBrief(userId);
  revalidateInbox();
}

export async function markAlertRead(alertId: string) {
  const { supabase, userId } = await getUserId();
  await supabase
    .from("alerts")
    .update({ read_at: new Date().toISOString() })
    .eq("id", alertId)
    .eq("user_id", userId);
  revalidatePath("/notifications");
  revalidatePath("/");
}
