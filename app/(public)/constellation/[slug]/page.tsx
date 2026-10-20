import { VentureDetail } from "@/features/constellation/detail";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <div className="mx-auto max-w-4xl"><VentureDetail slug={slug} /></div>;
}
