/**
 * WebSocket Client Module
 * Exports all WebSocket functionality for the frontend
 */

export { WebSocketProvider, useWebSocket } from './WebSocketContext';
export {
  useWebSocketEvent,
  useTaskEvents,
  useCommentEvents,
  useMemberEvents,
  usePresenceEvents,
  useUsersViewing,
  useTypingIndicator,
  useAutoJoinRooms,
  useTypingUsers,
} from './hooks';
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  TaskEvent,
  CommentEvent,
  MemberEvent,
  PresenceEvent,
  UsersViewingEvent,
  UserPresence,
  TypingEvent,
  RoomJoinData,
  RoomLeaveData,
  ConnectionStatus,
  WebSocketContextValue,
} from './types';
