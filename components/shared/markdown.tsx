import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

import { cn } from "@/lib/utils";
import { MarkdownImage } from "@/components/shared/markdown-image";

export function normalizeMarkdownSource(source: string) {
  const trimmed = source.trim();
  const wrappedMarkdown = trimmed.match(
    /^```(?:markdown|md)\s*\r?\n([\s\S]*?)\r?\n```\s*$/i,
  );

  return wrappedMarkdown?.[1] ?? source;
}

/**
 * Rendu Markdown côté serveur, sanitizé (XSS — cf. SDD §15).
 * Markdown First : utilisé pour le Knowledge Hub, problèmes, réponses…
 */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "markdown-content max-w-none",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{ img: MarkdownImage }}
      >
        {normalizeMarkdownSource(children)}
      </ReactMarkdown>
    </div>
  );
}
