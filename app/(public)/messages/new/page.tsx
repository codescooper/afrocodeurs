import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NewConversationForm } from "@/features/messaging/new-conversation-form";

export const metadata = { title: "Nouvelle conversation" };

export default async function NewMessagePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <div className="mx-auto w-full max-w-xl px-4 py-12"><Link href="/messages" className="text-sm text-muted-foreground hover:underline">← Messages</Link><h1 className="mt-5 text-3xl font-bold">Nouvelle conversation</h1><p className="mt-2 text-muted-foreground">Invitez un membre pour un échange privé, ou plusieurs membres pour créer un groupe.</p><div className="mt-8"><NewConversationForm /></div></div>;
}
