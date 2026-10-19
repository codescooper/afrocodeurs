import { SocialButtons } from "@/features/auth/social-buttons";

export const dynamic = "force-dynamic";

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6">{children}<SocialButtons /></div>;
}
