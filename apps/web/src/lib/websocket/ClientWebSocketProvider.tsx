'use client';

import { useEffect, useState } from 'react';
import { WebSocketProvider } from './WebSocketContext';
import { NotificationListener } from '@/components/notifications/NotificationListener';

export function ClientWebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render the WebSocketProvider on the client side
  if (!isClient) {
    return <>{children}</>; // Render children without the provider on the server
  }

  return (
    <WebSocketProvider>
      {/* NotificationListener is now inside WebSocketProvider where it belongs */}
      <NotificationListener />
      {children}
    </WebSocketProvider>
  );
}
