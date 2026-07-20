package com.example.backend.controllers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.security.Principal;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import com.example.backend.dtos.ChatMessageDto;
import com.example.backend.services.ChatService;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    private void broadcast(String destination, Object payload) {
        Message<?> message = MessageBuilder.withPayload(payload).build();
        messagingTemplate.send(destination, message);
    }

    @GetMapping("/rooms/{roomId}/messages")
    @ResponseBody
    public ResponseEntity<List<ChatMessageDto>> getRoomMessages(
            @PathVariable String roomId,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            return ResponseEntity.ok(chatService.getRoomMessages(roomId, authentication.getName()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).build();
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @MessageMapping("/chat/room/{roomId}")
    public void sendMessage(
            @DestinationVariable String roomId,
            @Payload ChatMessageDto message,
            Principal principal
    ) {
        String senderId = principal != null ? principal.getName() : null;
        if (senderId == null || message == null || message.getContent() == null || message.getContent().isBlank()) {
            return;
        }

        ChatMessageDto persisted;
        try {
            persisted = chatService.saveMessage(roomId, message, senderId);
        } catch (RuntimeException ex) {
            messagingTemplate.convertAndSendToUser(
                senderId,
                "/queue/errors",
                Map.of("message", "Unable to send message")
            );
            return;
        }

        // Broadcast to room
        broadcast("/topic/chat/room/" + roomId, persisted);

        // Send notification to the other user
        String receiverId;
        try {
            receiverId = chatService.getOtherParticipantId(roomId, senderId);
        } catch (RuntimeException ex) {
            return;
        }

        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "NEW_MESSAGE");
        notification.put("roomId", roomId);
        notification.put("message", persisted.getContent());
        notification.put("senderId", senderId);
        notification.put("senderName", persisted.getSenderName());

        messagingTemplate.convertAndSendToUser(
            receiverId,
            "/queue/notifications",
            notification
        );
    }

    @MessageMapping("/chat/room/{roomId}/read")
    public void markAsRead(
            @DestinationVariable String roomId,
            Principal principal
    ) {
        String userId = principal != null ? principal.getName() : null;
        if (userId == null) {
            return;
        }

        chatService.markAsRead(roomId, userId);
        Map<String, Object> readPayload = new HashMap<>();
        readPayload.put("userId", userId);
        readPayload.put("timestamp", LocalDateTime.now().toString());

        broadcast("/topic/chat/room/" + roomId + "/read", readPayload);
    }

    @MessageMapping("/chat/room/{roomId}/typing")
    public void typingIndicator(
            @DestinationVariable String roomId,
            @Payload Map<String, Boolean> payload,
            Principal principal
    ) {
        String userId = principal != null ? principal.getName() : null;
        if (userId == null) {
            return;
        }

        boolean isTyping = payload != null && Boolean.TRUE.equals(payload.get("isTyping"));
        Map<String, Object> typingPayload = new HashMap<>();
        typingPayload.put("userId", userId);
        typingPayload.put("isTyping", isTyping);
        broadcast("/topic/chat/room/" + roomId + "/typing", typingPayload);
    }
}
