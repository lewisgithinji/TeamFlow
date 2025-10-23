'use client';

import { useNotifications } from '@/lib/websocket/hooks';

/**
 * Component that listens for real-time notifications via WebSocket.
 * Must be used within WebSocketProvider context.
 *
 * This component has no visual output - it just sets up the notification listeners.
 */
export function NotificationListener() {
  // This hook sets up WebSocket listeners for notifications
  useNotifications();

  // Return null since this component doesn't render anything
  return null;
}
