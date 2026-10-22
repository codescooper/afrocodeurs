import { VentureDetail } from "@/features/constellation/detail";
import { VentureDetailModal } from "@/features/constellation/detail-modal";
export default async function ModalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <VentureDetailModal><VentureDetail slug={slug} overlay /></VentureDetailModal>;
}
