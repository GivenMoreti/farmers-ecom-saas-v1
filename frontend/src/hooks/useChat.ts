// hooks/useChat.ts
import { useEffect, useRef, useState } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { api } from "@/lib/api";

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: string;
  isRead: boolean;
  sentAt: string;
}

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const API_BASE = RAW_API_URL.endsWith("/api") ? RAW_API_URL.slice(0, -4) : RAW_API_URL;

export const useChat = (roomId: string, token: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    if (!roomId || !token) return;

    const socket = new SockJS(`${API_BASE}/ws/chat`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        setIsConnected(true);

        subscriptionRef.current = client.subscribe(
          `/topic/chat/room/${roomId}`,
          (message) => {
            const newMessage = JSON.parse(message.body);
            setMessages((prev) => [...prev, newMessage]);
          },
        );

        client.subscribe(`/topic/chat/room/${roomId}/typing`, (message) => {
          const data = JSON.parse(message.body);
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            return newSet;
          });
        });

        client.subscribe(`/topic/chat/room/${roomId}/read`, (message) => {
          const data = JSON.parse(message.body);
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              isRead: msg.senderId !== data.userId ? true : msg.isRead,
            })),
          );
        });

        loadMessages();
      },
      onStompError: (frame) => {
        console.error("WebSocket error:", frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionRef.current?.unsubscribe();
      client.deactivate();
    };
  }, [roomId, token]);

  const loadMessages = async () => {
    try {
      const data = await api.get(`/chat/rooms/${roomId}/messages`, token);
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const sendMessage = (
    content: string,
    type: "TEXT" | "IMAGE" | "LOCATION" = "TEXT",
  ) => {
    if (!clientRef.current || !isConnected) return;

    clientRef.current.publish({
      destination: `/app/chat/room/${roomId}`,
      body: JSON.stringify({ content, type }),
    });
  };

  const sendTyping = (isTyping: boolean) => {
    if (!clientRef.current || !isConnected) return;

    clientRef.current.publish({
      destination: `/app/chat/room/${roomId}/typing`,
      body: JSON.stringify({ isTyping }),
    });
  };

  const markAsRead = () => {
    if (!clientRef.current || !isConnected) return;

    clientRef.current.publish({
      destination: `/app/chat/room/${roomId}/read`,
      body: JSON.stringify({}),
    });
  };

  return {
    messages,
    sendMessage,
    sendTyping,
    markAsRead,
    isConnected,
    typingUsers,
  };
};
