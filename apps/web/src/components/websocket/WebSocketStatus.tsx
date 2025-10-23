'use client';

import { useWebSocket } from '@/lib/websocket';
import { useEffect, useState } from 'react';

function WebSocketStatusInner() {
  const { connectionStatus, isConnected, error } = useWebSocket();

  // Don't show anything when connected (clean UI)
  if (isConnected) {
    return null;
  }

  // Show status for other states
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`
        flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg
        ${connectionStatus === 'connecting' ? 'bg-blue-500 text-white' : ''}
        ${connectionStatus === 'disconnected' ? 'bg-gray-500 text-white' : ''}
        ${connectionStatus === 'error' ? 'bg-red-500 text-white' : ''}
      `}
      >
        {/* Status indicator dot */}
        <div className="relative flex h-3 w-3">
          {connectionStatus === 'connecting' && (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </>
          )}
          {connectionStatus === 'disconnected' && (
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          )}
          {connectionStatus === 'error' && (
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          )}
        </div>

        {/* Status text */}
        <div className="text-sm font-medium">
          {connectionStatus === 'connecting' && 'Connecting to server...'}
          {connectionStatus === 'disconnected' && 'Disconnected from server'}
          {connectionStatus === 'error' && (error || 'Connection error')}
        </div>
      </div>
    </div>
  );
}

export function WebSocketStatus() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted on client
  if (!mounted) {
    return null;
  }

  // Return the inner component wrapped in error boundary
  return <WebSocketStatusInner />;
}
