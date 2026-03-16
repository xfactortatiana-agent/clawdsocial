"use client";

import { ContentQueueManager } from "@/components/queue/ContentQueue";

export default function QueuePage() {
  // Use default IDs for now - in production these come from context
  const workspaceId = "default";
  const accountId = "default";

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Content Queue</h1>
          <p className="text-slate-400">Automate your content scheduling</p>
        </div>

        <ContentQueueManager 
          workspaceId={workspaceId}
          accountId={accountId}
        />
      </div>
    </div>
  );
}
