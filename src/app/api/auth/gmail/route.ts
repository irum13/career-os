import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGmailAuthUrl } from "@/lib/mail/gmail";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));
  }

  const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64url");
  return NextResponse.redirect(getGmailAuthUrl(state));
}
