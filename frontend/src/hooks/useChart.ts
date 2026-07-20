// hooks/useChat.ts
import { useEffect, useState, useRef } from "react";
import { Client, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

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

export const useChat = (roomId: string, token: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const clientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    const socket = new SockJS(`${process.env.NEXT_PUBLIC_API_URL}/ws/chat`);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        setIsConnected(true);

        // Subscribe to chat room
        subscriptionRef.current = client.subscribe(
          `/topic/chat/room/${roomId}`,
          (message) => {
            const newMessage = JSON.parse(message.body);
            setMessages((prev) => [...prev, newMessage]);
          },
        );

        // Subscribe to typing indicators
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

        // Subscribe to read receipts
        client.subscribe(`/topic/chat/room/${roomId}/read`, (message) => {
          const data = JSON.parse(message.body);
          setMessages((prev) =>
            prev.map((msg) => ({
              ...msg,
              isRead: msg.senderId !== data.userId ? true : msg.isRead,
            })),
          );
        });

        // Load existing messages
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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat/rooms/${roomId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
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
