"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SidebarContextValue = {
  isOpen: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebarContext doit être utilisé dans SidebarProvider");
  }
  return ctx;
}

/** État réduit/déployé de la sidebar dashboard (desktop uniquement — mobile a sa propre nav basse). */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <SidebarContext.Provider
      value={{ isOpen, toggleSidebar: () => setIsOpen((v) => !v) }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
