package com.example.backend.controllers;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import com.example.backend.dtos.ChatMessageDto;
import com.example.backend.models.ChatRoom;
import com.example.backend.models.Message;
import com.example.backend.models.User;
import com.example.backend.repositories.ChatRoomRepository;
import com.example.backend.repositories.MessageRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/room/{roomId}")
    public void sendMessage(
            @DestinationVariable String roomId,
            @Payload ChatMessageDto message,
            Authentication auth
    ) {
        String senderId = auth.getName();

        ChatRoom room = chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new RuntimeException("Chat room not found"));

        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("Sender not found"));

        // Save message
        Message entity = Message.builder()
            .room(room)
            .sender(sender)
            .content(message.getContent())
            .type(message.getType() != null? message.getType() : Message.MessageType.TEXT)
            .isRead(false)
            .sentAt(LocalDateTime.now())
            .build();

        messageRepository.save(entity);

        // Update room's last message time
        room.setLastMessageAt(LocalDateTime.now());
        chatRoomRepository.save(room);

        // Broadcast to room
        messagingTemplate.convertAndSend(
            "/topic/chat/room/" + roomId,
            ChatMessageDto.fromEntity(entity)
        );

        // Send notification to the other user
        String receiverId = room.getBuyer().getId().equals(senderId)
            ? room.getFarmer().getId()
            : room.getBuyer().getId();

        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "NEW_MESSAGE");
        notification.put("roomId", roomId);
        notification.put("message", message.getContent());
        notification.put("senderId", senderId);
        notification.put("senderName", sender.getDisplayName());

        messagingTemplate.convertAndSendToUser(
            receiverId,
            "/queue/notifications",
            notification
        );
    }

    @MessageMapping("/chat/room/{roomId}/read")
    public void markAsRead(
            @DestinationVariable String roomId,
            Authentication auth
    ) {
        String userId = auth.getName();
        messageRepository.markAllAsRead(roomId, userId);

        messagingTemplate.convertAndSend(
            "/topic/chat/room/" + roomId + "/read",
            Map.of("userId", userId, "timestamp", LocalDateTime.now())
        );
    }

    @MessageMapping("/chat/room/{roomId}/typing")
    public void typingIndicator(
            @DestinationVariable String roomId,
            @Payload Map<String, Boolean> payload,
            Authentication auth
    ) {
        String userId = auth.getName();
        messagingTemplate.convertAndSend(
            "/topic/chat/room/" + roomId + "/typing",
            Map.of("userId", userId, "isTyping", payload.get("isTyping"))
        );
    }
}
