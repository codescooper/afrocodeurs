import { SiteHeader } from "@/components/layout/site-header";
import { SiteSidebar } from "@/components/layout/site-sidebar";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";

// Pages publiques alimentées par la base : rendu dynamique (pas de prerender au
// build, où la base managée n'est pas joignable). Cascade sur toutes les pages.
export const dynamic = "force-dynamic";

/** Layout public : sidebar verticale (desktop) + en-tête compact mobile + navigation basse mobile. */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <SiteSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader />
        {/* pb-20 : laisse la place à la barre mobile basse */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <SiteFooter />
      </div>
      <MobileNav />
    </div>
  );
}
