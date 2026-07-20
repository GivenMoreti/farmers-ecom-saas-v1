package com.example.backend.services;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import com.example.backend.dtos.ChatMessageDto;
import com.example.backend.models.ChatRoom;
import com.example.backend.models.Message;
import com.example.backend.models.User;
import com.example.backend.repositories.ChatRoomRepository;
import com.example.backend.repositories.MessageRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;

    public List<ChatMessageDto> getRoomMessages(String roomId, String userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new RuntimeException("Chat room not found"));

        if (!room.getBuyer().getId().equals(userId) && !room.getFarmer().getId().equals(userId)) {
            throw new SecurityException("Unauthorized");
        }

        return messageRepository.findByRoomIdOrderBySentAtAsc(roomId)
            .stream()
            .map(ChatMessageDto::fromEntity)
            .toList();
    }

    public ChatMessageDto saveMessage(String roomId, ChatMessageDto message, String senderId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new RuntimeException("Chat room not found"));

        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("Sender not found"));

        Message.MessageType messageType = Message.MessageType.TEXT;
        if (message.getType() != null && !message.getType().isBlank()) {
            messageType = Message.MessageType.valueOf(message.getType().toUpperCase());
        }

        Message entity = Message.builder()
            .room(room)
            .sender(sender)
            .content(message.getContent())
            .type(messageType)
            .isRead(false)
            .sentAt(LocalDateTime.now())
            .build();

        messageRepository.save(entity);

        room.setLastMessageAt(LocalDateTime.now());
        chatRoomRepository.save(room);

        return ChatMessageDto.fromEntity(entity);
    }

    public String getOtherParticipantId(String roomId, String senderId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
            .orElseThrow(() -> new RuntimeException("Chat room not found"));

        if (room.getBuyer().getId().equals(senderId)) {
            return room.getFarmer().getId();
        }
        if (room.getFarmer().getId().equals(senderId)) {
            return room.getBuyer().getId();
        }

        throw new SecurityException("Unauthorized");
    }

    public void markAsRead(String roomId, String userId) {
        messageRepository.markAllAsRead(roomId, userId);
    }
}
