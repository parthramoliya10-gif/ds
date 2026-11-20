"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket/socketClient";
import { useAuth } from "./AuthContext";
import api from "@/lib/api/client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadChatCount: number;
  refreshUnreadCount: () => Promise<void>;
  joinRoom: (requestId: string) => Promise<any>;
  leaveRoom: (requestId: string) => void;
  sendMessage: (
    requestId: string,
    content: string,
    messageType?: string,
    metadata?: any
  ) => Promise<any>;
  emitTyping: (requestId: string, isTyping: boolean) => void;
  markRead: (requestId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadChatCount(0);
      return;
    }
    try {
      const res = await api.chat.getUnreadCount();
      if (res && typeof res.unreadCount === "number") {
        setUnreadChatCount(res.unreadCount);
        return;
      }
    } catch {
      // Fallback: calculate from api.requests.list if getUnreadCount endpoint fails
      try {
        const res = await api.requests.list({ limit: 50 });
        if (res && Array.isArray(res.requests)) {
          const total = res.requests.reduce((acc: number, r: any) => {
            const count = r.conversation?._count?.messages ?? r.unreadCount ?? 0;
            return acc + count;
          }, 0);
          setUnreadChatCount(total);
        }
      } catch {
        // ignore background fetch error
      }
    }
  }, [user]);

  // Initial load and whenever user changes
  useEffect(() => {
    if (user) {
      refreshUnreadCount();
    } else {
      setUnreadChatCount(0);
    }
  }, [user, refreshUnreadCount]);

  useEffect(() => {
    let active = true;

    if (!user) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    getSocket().then((s) => {
      if (!active || !s) return;
      setSocket(s);
      setIsConnected(s.connected);

      const handleConnect = () => {
        setIsConnected(true);
        refreshUnreadCount();
      };
      const handleDisconnect = () => setIsConnected(false);

      const handleNewMessage = (newMsg: any) => {
        const isFromCounterpart =
          user?.role === "admin"
            ? newMsg.senderRole === "USER" || newMsg.sender?.role?.toUpperCase() === "USER"
            : newMsg.senderRole === "ADMIN" || newMsg.sender?.role?.toUpperCase() === "ADMIN";

        if (isFromCounterpart) {
          const pathname = typeof window !== "undefined" ? window.location.pathname : "";
          const targetReqId = newMsg.requestId || newMsg.conversation?.requestId;
          const isInCurrentRoom = Boolean(targetReqId && pathname.includes(targetReqId));

          if (!isInCurrentRoom) {
            setUnreadChatCount((prev) => prev + 1);
          }
        }
      };

      const handleMessagesRead = () => {
        refreshUnreadCount();
      };

      s.on(SOCKET_EVENTS.CONNECT, handleConnect);
      s.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      s.on(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
      s.on(SOCKET_EVENTS.MESSAGES_READ, handleMessagesRead);

      return () => {
        s.off(SOCKET_EVENTS.CONNECT, handleConnect);
        s.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
        s.off(SOCKET_EVENTS.NEW_MESSAGE, handleNewMessage);
        s.off(SOCKET_EVENTS.MESSAGES_READ, handleMessagesRead);
      };
    });

    return () => {
      active = false;
    };
  }, [user, refreshUnreadCount]);

  const joinRoom = useCallback(
    async (requestId: string): Promise<any> => {
      if (!socket) return false;
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve({ success: true, counterpartOnline: false });
        }, 1200);

        socket.emit(
          SOCKET_EVENTS.JOIN_REQUEST_ROOM,
          { requestId },
          (response: any) => {
            clearTimeout(timer);
            resolve(response || { success: true });
          }
        );
      });
    },
    [socket]
  );

  const leaveRoom = useCallback(
    (requestId: string) => {
      if (socket) {
        socket.emit(SOCKET_EVENTS.LEAVE_REQUEST_ROOM, { requestId });
      }
    },
    [socket]
  );

  const sendMessage = useCallback(
    async (
      requestId: string,
      content: string,
      messageType = "TEXT",
      metadata?: any
    ): Promise<any> => {
      if (!socket) throw new Error("Socket is not connected.");

      return new Promise((resolve, reject) => {
        socket.emit(
          SOCKET_EVENTS.SEND_MESSAGE,
          { requestId, content, messageType, metadata },
          (response: any) => {
            if (response && response.success) {
              resolve(response.message);
            } else {
              reject(new Error(response?.error || "Failed to send message."));
            }
          }
        );
      });
    },
    [socket]
  );

  const emitTyping = useCallback(
    (requestId: string, isTyping: boolean) => {
      if (socket) {
        socket.emit(
          isTyping ? SOCKET_EVENTS.TYPING_START : SOCKET_EVENTS.TYPING_STOP,
          { requestId }
        );
      }
    },
    [socket]
  );

  const markRead = useCallback(
    (requestId: string) => {
      if (socket) {
        socket.emit(SOCKET_EVENTS.MARK_READ, { requestId });
      }
      setTimeout(() => {
        refreshUnreadCount();
      }, 300);
    },
    [socket, refreshUnreadCount]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        unreadChatCount,
        refreshUnreadCount,
        joinRoom,
        leaveRoom,
        sendMessage,
        emitTyping,
        markRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}

export default SocketContext;
