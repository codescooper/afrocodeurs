import type { ReactNode } from "react";

/** Disposition des pages hub (Explorer, Forum, Knowledge, Atlas…) : en-tête, contenu + rail optionnel. */
export function HubTemplate({
  title,
  description,
  action,
  rail,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  rail?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>

      <div className={rail ? "mt-8 grid gap-8 lg:grid-cols-[1fr_320px]" : "mt-8"}>
        <div>{children}</div>
        {rail && <div className="hidden lg:block">{rail}</div>}
      </div>
    </div>
  );
}
