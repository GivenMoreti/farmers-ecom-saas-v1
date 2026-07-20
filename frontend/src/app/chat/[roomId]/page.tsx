// app/chat/[roomId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { useState, useRef, useEffect } from "react";

export default function ChatPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [input, setInput] = useState("");
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
    setUserId(localStorage.getItem("userId") || "");
  }, []);

  const {
    messages,
    sendMessage,
    sendTyping,
    markAsRead,
    isConnected,
    typingUsers,
  } = useChat(roomId, token);

  useEffect(() => {
    markAsRead();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const isTyping = typingUsers.size > 0;

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h2 className="text-lg font-semibold">Chat</h2>
        <p className="text-sm text-gray-500">
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.senderId === userId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                  isOwn
                    ? "bg-primary text-white"
                    : "bg-white border border-gray-200 text-gray-800"
                }`}
              >
                {!isOwn && (
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {msg.senderName}
                  </p>
                )}
                <p>{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwn ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {new Date(msg.sentAt).toLocaleTimeString()}
                  {isOwn && msg.isRead && " ✓✓"}
                </p>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-400">Someone is typing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              sendTyping(e.target.value.length > 0);
            }}
            onBlur={() => sendTyping(false)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
