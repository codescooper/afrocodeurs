import { serializeStructuredData } from "@/lib/seo";

export function StructuredData({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }} />;
}
