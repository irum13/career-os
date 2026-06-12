import type { Item, Profile } from "./types";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function buildProfileContext(profile: Profile | null) {
  if (!profile) return "";
  return `User context: ${profile.status} at ${profile.school}, studying ${profile.program} in ${profile.location}. Career focus: ${profile.career_focus}.`;
}

export async function summarizeTrending(
  items: Item[],
  profile: Profile | null
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || items.length === 0) {
    return items.length === 0
      ? "No new newsletters or updates in this period."
      : "Trending updates available — review your inbox highlights below.";
  }

  const itemSummaries = items
    .slice(0, 20)
    .map((i) => `- ${i.title}${i.sender ? ` (${i.sender})` : ""}`)
    .join("\n");

  const prompt = `${buildProfileContext(profile)}

Summarize what's trending across these email/newsletter items in exactly 2 short lines (max 40 words total). Focus on AI/tech news relevant to a data science graduate student.

Items:
${itemSummaries}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 120, temperature: 0.4 },
      }),
    });

    if (!res.ok) {
      console.error("Gemini error:", await res.text());
      return "Trending summary unavailable — check inbox highlights.";
    }

    const data = await res.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "Trending summary unavailable."
    );
  } catch (err) {
    console.error("Gemini fetch failed:", err);
    return "Trending summary unavailable — check inbox highlights.";
  }
}

export async function draftActionContent(
  requestText: string,
  profile: Profile | null,
  context?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return `Draft for: ${requestText}\n\n[Configure GEMINI_API_KEY to generate drafts]`;
  }

  const prompt = `${buildProfileContext(profile)}

The user requested: ${requestText}
${context ? `\nAdditional context:\n${context}` : ""}

Write a professional draft (cover letter, email, or application text as appropriate). Do not send or submit — this is for user review only.`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1024, temperature: 0.5 },
    }),
  });

  if (!res.ok) return `Draft generation failed for: ${requestText}`;
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "Draft generation failed.";
}
