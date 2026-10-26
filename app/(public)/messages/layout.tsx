import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata = { robots: PRIVATE_ROBOTS };

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
