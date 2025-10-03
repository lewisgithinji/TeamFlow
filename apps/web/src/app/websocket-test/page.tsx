'use client';

import { useState } from 'react';
import {
  useWebSocket,
  useTaskEvents,
  useCommentEvents,
  usePresenceEvents,
  useTypingUsers,
  useTypingIndicator,
} from '@/lib/websocket';

export default function WebSocketTestPage() {
  const {
    isConnected,
    connectionStatus,
    error,
    joinRoom,
    leaveRoom,
    updatePresence,
  } = useWebSocket();

  const [workspaceId, setWorkspaceId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [events, setEvents] = useState<string[]>([]);

  const addEvent = (message: string) => {
    setEvents((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 50));
  };

  // Listen to task events
  useTaskEvents({
    onTaskCreated: (data) => addEvent(`📋 Task created: ${data.taskId}`),
    onTaskUpdated: (data) => addEvent(`📝 Task updated: ${data.taskId}`),
    onTaskDeleted: (data) => addEvent(`🗑️ Task deleted: ${data.taskId}`),
    onTaskMoved: (data) => addEvent(`🔄 Task moved: ${data.taskId}`),
  });

  // Listen to comment events
  useCommentEvents({
    onCommentCreated: (data) => addEvent(`💬 Comment created: ${data.commentId}`),
    onCommentUpdated: (data) => addEvent(`✏️ Comment updated: ${data.commentId}`),
    onCommentDeleted: (data) => addEvent(`🗑️ Comment deleted: ${data.commentId}`),
  });

  // Listen to presence events
  usePresenceEvents({
    onUserOnline: (data) => addEvent(`👤 ${data.name} is online`),
    onUserOffline: (data) => addEvent(`👤 ${data.name} is offline`),
  });

  // Typing indicator hook
  const { handleTyping, handleStopTyping } = useTypingIndicator(taskId);
  const typingUsers = useTypingUsers(taskId);

  const handleJoinRooms = () => {
    const data: any = {};
    if (workspaceId) data.workspaceId = workspaceId;
    if (projectId) data.projectId = projectId;
    if (taskId) data.taskId = taskId;

    joinRoom(data);
    addEvent(`📥 Joined rooms: ${JSON.stringify(data)}`);
  };

  const handleLeaveRooms = () => {
    const data: any = {};
    if (workspaceId) data.workspaceId = workspaceId;
    if (projectId) data.projectId = projectId;
    if (taskId) data.taskId = taskId;

    leaveRoom(data);
    addEvent(`📤 Left rooms: ${JSON.stringify(data)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">WebSocket Test Dashboard</h1>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="flex items-center gap-4">
            <div
              className={`
                px-4 py-2 rounded-full font-medium
                ${isConnected ? 'bg-green-100 text-green-800' : ''}
                ${connectionStatus === 'connecting' ? 'bg-blue-100 text-blue-800' : ''}
                ${connectionStatus === 'disconnected' ? 'bg-gray-100 text-gray-800' : ''}
                ${connectionStatus === 'error' ? 'bg-red-100 text-red-800' : ''}
              `}
            >
              {connectionStatus === 'connected' && '✅ Connected'}
              {connectionStatus === 'connecting' && '⏳ Connecting...'}
              {connectionStatus === 'disconnected' && '❌ Disconnected'}
              {connectionStatus === 'error' && `❌ Error: ${error}`}
            </div>
          </div>
        </div>

        {/* Room Management */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Room Management</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Workspace ID"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Task ID"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <div className="flex gap-3">
              <button
                onClick={handleJoinRooms}
                disabled={!isConnected}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                Join Rooms
              </button>
              <button
                onClick={handleLeaveRooms}
                disabled={!isConnected}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50"
              >
                Leave Rooms
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                updatePresence('online');
                addEvent('👤 Set presence to online');
              }}
              disabled={!isConnected}
              className="px-6 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
            >
              Set Online
            </button>
            <button
              onClick={() => {
                updatePresence('away');
                addEvent('👤 Set presence to away');
              }}
              disabled={!isConnected}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg disabled:opacity-50"
            >
              Set Away
            </button>
            <button
              onClick={() => {
                handleTyping();
                addEvent('⌨️ Started typing');
              }}
              disabled={!isConnected || !taskId}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg disabled:opacity-50"
            >
              Start Typing
            </button>
            <button
              onClick={() => {
                handleStopTyping();
                addEvent('⌨️ Stopped typing');
              }}
              disabled={!isConnected || !taskId}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg disabled:opacity-50"
            >
              Stop Typing
            </button>
          </div>
        </div>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">
              ⌨️ {typingUsers.map((u) => u.name).join(', ')}{' '}
              {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </p>
          </div>
        )}

        {/* Event Log */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Event Log</h2>
            <button
              onClick={() => setEvents([])}
              className="px-4 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              Clear
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {events.length === 0 ? (
              <p className="text-gray-400">No events yet. Perform an action to see events.</p>
            ) : (
              events.map((event, i) => (
                <div key={i} className="py-1 border-b border-gray-200 last:border-0">
                  {event}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
