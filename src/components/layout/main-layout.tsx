import * as React from "react";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <div className="container-max flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary" />
            <span className="text-sm font-semibold tracking-wide">KIN Communications Hub</span>
          </div>
          <div className="text-xs text-muted-foreground">v0.1.0</div>
        </div>
      </header>
      <main className="container-max py-6">
        <DashboardNav />
        <div className="py-6">{children}</div>
      </main>
    </div>
  );
}


