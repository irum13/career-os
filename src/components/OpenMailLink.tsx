import { ExternalLink } from "lucide-react";
import { getMailWebUrl } from "@/lib/mail/urls";
import type { SourceType } from "@/lib/types";

export function OpenMailLink({
  sourceType,
  externalId,
  url,
}: {
  sourceType: SourceType;
  externalId: string | null;
  url: string | null;
}) {
  const link = getMailWebUrl({ source_type: sourceType, external_id: externalId, url });

  if (!link) return null;

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--accent)] hover:bg-blue-50"
    >
      <ExternalLink size={14} />
      {link.label}
    </a>
  );
}
