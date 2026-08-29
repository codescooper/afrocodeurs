import Link from "next/link";

import {
  COMMUNITY_EMAIL,
  DISCORD_INVITE_URL,
  GITHUB_URL,
  WHATSAPP_INVITE_URL,
} from "@/lib/community-links";

const EXPLORE_LINKS = [
  { href: "/explorer", label: "Problèmes" },
  { href: "/knowledge", label: "Ressources" },
  { href: "/atlas", label: "Solutions" },
  { href: "/forum", label: "Forum" },
  { href: "/communities", label: "Communautés" },
  { href: "/afromakers", label: "AfroMakers" },
];

const LEGAL_LINKS = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions d'utilisation" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <p className="font-bold">AfroCodeurs</p>
            <p className="mt-2 text-sm text-muted-foreground">
              La communauté panafricaine des makers tech. Build Before Consume.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-6 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Explorer
              </span>
              {EXPLORE_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Légal
              </span>
              {LEGAL_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Projet
              </span>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                GitHub
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contact
              </span>
              <Link href="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                Nous contacter
              </Link>
              <a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
                Discord
              </a>
              <a href={WHATSAPP_INVITE_URL} target="_blank" rel="noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
                WhatsApp
              </a>
              <a href={`mailto:${COMMUNITY_EMAIL}`} className="text-muted-foreground transition-colors hover:text-foreground">
                {COMMUNITY_EMAIL}
              </a>
            </div>
          </nav>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          © {year} AfroCodeurs — open source (MIT). Fait avec ❤️ pour le
          continent.
        </p>
      </div>
    </footer>
  );
}
