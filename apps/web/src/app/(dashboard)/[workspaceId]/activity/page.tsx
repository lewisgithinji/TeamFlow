'use client';

import { ActivityFeed } from '@/components/activity/ActivityFeed';

interface ActivityPageProps {
  params: {
    workspaceId: string;
  };
}

export default function ActivityPage({ params }: ActivityPageProps) {
  return (
    <div className="h-full px-4 py-6 lg:px-8">
      <div className="h-full space-y-6">
        <ActivityFeed workspaceId={params.workspaceId} />
      </div>
    </div>
  );
}
