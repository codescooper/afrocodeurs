import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";

// Pages publiques alimentées par la base : rendu dynamique (pas de prerender au
// build, où la base managée n'est pas joignable). Cascade sur toutes les pages.
export const dynamic = "force-dynamic";

/** Layout public : en-tête, contenu, navigation basse mobile. */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      {/* pb-20 : laisse la place à la barre mobile basse */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileNav />
    </div>
  );
}
