"use client";

import React from "react";
import { useApp } from "@/components/shared/AppContext";
import { cn } from "@/lib/utils";

export default function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useApp();

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-w-0 h-full overflow-hidden transition-all duration-300",
        sidebarOpen ? "lg:pl-60" : "lg:pl-16"
      )}
    >
      {children}
    </div>
  );
}
