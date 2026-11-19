import { io, Socket } from "socket.io-client";
import { getAuthToken } from "../api/client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const SOCKET_EVENTS = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  USER_STATUS_CHANGE: "user_status_change",
  JOIN_REQUEST_ROOM: "join_request_room",
  LEAVE_REQUEST_ROOM: "leave_request_room",
  ROOM_JOINED: "room_joined",
  ROOM_ERROR: "room_error",
  SEND_MESSAGE: "send_message",
  NEW_MESSAGE: "new_message",
  MESSAGE_DELIVERED: "message_delivered",
  MESSAGE_STATUS_UPDATE: "message_status_update",
  MARK_READ: "mark_read",
  MESSAGES_READ: "messages_read",
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
  USER_TYPING: "user_typing",
  QUOTATION_RECEIVED: "quotation_received",
  PAYMENT_CONFIRMED: "payment_confirmed",
} as const;

export async function getSocket(): Promise<Socket> {
  if (socket && socket.connected) {
    return socket;
  }

  const token = await getAuthToken();

  if (socket) {
    // If socket exists but disconnected or token changed
    if (token) {
      socket.auth = { token };
    }
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    withCredentials: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
  });

  socket.on(SOCKET_EVENTS.CONNECT, () => {
    console.log("⚡ Socket.IO connected:", socket?.id);
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
    console.log("🔌 Socket.IO disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.warn("⚠️ Socket.IO connection error:", error.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket;
