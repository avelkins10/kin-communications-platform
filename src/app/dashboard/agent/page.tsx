"use client";

import { useSession } from "next-auth/react";
import { AgentDashboard } from "@/components/taskrouter/agent-dashboard";
import { Card } from "@/components/ui/card";

export default function AgentPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <Card className="p-6">
        <p>Please sign in to access the agent dashboard.</p>
      </Card>
    );
  }

  return <AgentDashboard />;
}