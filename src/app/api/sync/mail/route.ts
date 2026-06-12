import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncMailForUser } from "@/lib/mail/sync";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncMailForUser(user.id, 24);
  return NextResponse.json(result);
}
