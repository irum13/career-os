import type { Item, Profile } from "./types";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function geminiErrorMessage(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    const msg = parsed.error?.message ?? "";
    if (status === 429 || msg.includes("quota")) {
      return "Gemini free-tier quota exceeded. Wait a minute and try again, or enable billing in Google AI Studio.";
    }
    if (status === 400 || status === 401 || status === 403) {
      return "Gemini API key rejected. Check GEMINI_API_KEY in Vercel and redeploy.";
    }
  } catch {
    // ignore parse errors
  }
  return "Brief generation failed. Try again later.";
}

function buildProfileContext(profile: Profile | null) {
  if (!profile) return "";
  return `User context: ${profile.status} at ${profile.school}, studying ${profile.program} in ${profile.location}. Career focus: ${profile.career_focus}.`;
}

export interface NewsBriefIdea {
  title: string;
  description: string;
}

export async function generateNewsBriefContent(
  items: Item[],
  profile: Profile | null
): Promise<{ summary: string; ideas: NewsBriefIdea[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  const fallback = {
    summary: "Configure GEMINI_API_KEY to generate AI news briefs.",
    ideas: [] as NewsBriefIdea[],
  };

  if (!apiKey) return fallback;
  if (!items.length) {
    return { summary: "No newsletter content to summarize yet.", ideas: [] };
  }

  const newsletters = items
    .map((item, index) => {
      const body = item.body_text || item.summary || "";
      const trimmed = body.length > 6000 ? `${body.slice(0, 6000)}…` : body;
      return `--- Newsletter ${index + 1} ---
From: ${item.sender ?? "unknown"}
Subject: ${item.title}
Date: ${item.received_at}

${trimmed}`;
    })
    .join("\n\n");

  const prompt = `${buildProfileContext(profile)}

You are helping a graduate student stay current on AI and tech news from their curated newsletters.

Read the full newsletter content below and respond in valid JSON only (no markdown fences):
{
  "summary": "3 to 7 short lines summarizing the most important AI/tech developments across these newsletters. Be specific, not generic.",
  "ideas": [
    { "title": "short project or skill idea", "description": "1-2 sentences on how to use this news for portfolio, internships, or career growth" }
  ]
}

Include 2 to 3 ideas in the ideas array. Ground everything only in the newsletters provided.

Newsletters:
${newsletters}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 768, temperature: 0.4 },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Gemini error:", errBody);
      return { summary: geminiErrorMessage(res.status, errBody), ideas: [] };
    }

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { summary: raw || "Brief generation failed.", ideas: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      summary?: string;
      ideas?: NewsBriefIdea[];
    };

    return {
      summary: parsed.summary?.trim() || "Summary unavailable.",
      ideas: (parsed.ideas ?? []).slice(0, 3).map((idea) => ({
        title: idea.title?.trim() || "Idea",
        description: idea.description?.trim() || "",
      })),
    };
  } catch (err) {
    console.error("Gemini fetch failed:", err);
    return { summary: "Brief generation failed. Try again later.", ideas: [] };
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
