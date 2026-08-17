"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export function NotificationLink({
  id,
  href,
  className,
  children,
  onOpen,
}: {
  id: string;
  href: string;
  className?: string;
  children: ReactNode;
  onOpen?: () => void;
}) {
  const markRead = () => {
    onOpen?.();
    void fetch("/api/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
      keepalive: true,
    });
  };

  return (
    <Link href={href} className={className} onClick={markRead}>
      {children}
    </Link>
  );
}
