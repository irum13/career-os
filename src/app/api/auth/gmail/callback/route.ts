import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { exchangeGmailCode } from "@/lib/mail/gmail";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/sources?error=auth", process.env.NEXT_PUBLIC_APP_URL));
  }

  const { userId } = JSON.parse(Buffer.from(state, "base64url").toString());
  const tokens = await exchangeGmailCode(code);

  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/sources?error=token", process.env.NEXT_PUBLIC_APP_URL));
  }

  const profileRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileRes.json();

  const supabase = await createServiceClient();
  await supabase.from("connected_accounts").upsert(
    {
      user_id: userId,
      provider: "gmail",
      email: profile.emailAddress,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
      scan_inbox: true,
      scan_promotions: true,
      scan_junk: true,
    },
    { onConflict: "user_id,provider" }
  );

  return NextResponse.redirect(new URL("/sources?connected=gmail", process.env.NEXT_PUBLIC_APP_URL));
}
