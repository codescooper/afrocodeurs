"use client";

import { PanelLeft } from "lucide-react";

import { useSidebarContext } from "./sidebar-context";

export function SidebarToggle() {
  const { toggleSidebar } = useSidebarContext();
  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label="Replier/déplier la navigation"
      className="hidden rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:inline-flex"
    >
      <PanelLeft className="size-4" />
    </button>
  );
}
