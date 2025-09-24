"use client";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { value: "queue", label: "Queue", href: "/dashboard/queue" },
  { value: "contacts", label: "Contacts", href: "/dashboard/contacts" },
  { value: "history", label: "History", href: "/dashboard/history" },
  { value: "settings", label: "Settings", href: "/dashboard/settings" }
];

export function DashboardNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const current = React.useMemo(() => {
    const found = tabs.find(t => pathname?.startsWith(`/dashboard/${t.value}`));
    return found?.value ?? "queue";
  }, [pathname]);

  return (
    <Tabs value={current} onValueChange={val => router.push(`/dashboard/${val}`)}>
      <TabsList className="w-full justify-start gap-1">
        {tabs.map(t => (
          <TabsTrigger key={t.value} value={t.value} className="px-4">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
}


