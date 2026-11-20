"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket, SOCKET_EVENTS } from "@/lib/socket/socketClient";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
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

      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      s.on(SOCKET_EVENTS.CONNECT, handleConnect);
      s.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);

      return () => {
        s.off(SOCKET_EVENTS.CONNECT, handleConnect);
        s.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      };
    });

    return () => {
      active = false;
    };
  }, [user]);

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
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
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
