import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { exchangeOutlookCode, getOutlookProfile } from "@/lib/mail/outlook";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription = request.nextUrl.searchParams.get("error_description");

  if (error) {
    console.error("Outlook OAuth error:", error, errorDescription);
    const redirectUrl = new URL("/sources", process.env.NEXT_PUBLIC_APP_URL);
    redirectUrl.searchParams.set("error", "outlook");
    if (errorDescription) {
      redirectUrl.searchParams.set("message", errorDescription.slice(0, 200));
    }
    return NextResponse.redirect(redirectUrl);
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/sources?error=auth", process.env.NEXT_PUBLIC_APP_URL));
  }

  const { userId } = JSON.parse(Buffer.from(state, "base64url").toString());
  const tokens = await exchangeOutlookCode(code);

  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/sources?error=token", process.env.NEXT_PUBLIC_APP_URL));
  }

  const profile = await getOutlookProfile(tokens.access_token);
  const supabase = await createServiceClient();

  await supabase.from("connected_accounts").upsert(
    {
      user_id: userId,
      provider: "outlook",
      email: profile.mail || profile.userPrincipalName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString(),
      scan_inbox: true,
      scan_promotions: true,
      scan_junk: true,
    },
    { onConflict: "user_id,provider" }
  );

  return NextResponse.redirect(new URL("/sources?connected=outlook", process.env.NEXT_PUBLIC_APP_URL));
}
