package com.example.backend.dtos;

import java.time.LocalDateTime;
import com.example.backend.models.Message;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
     private String id;
    private String roomId;
    private String senderId;
    private String senderName;
    private String content;
    private String type;
    private boolean isRead;
    private LocalDateTime sentAt;

    public static ChatMessageDto fromEntity(Message message) {
        return ChatMessageDto.builder()
            .id(message.getId())
            .roomId(message.getRoom().getId())
            .senderId(message.getSender().getId())
            .senderName(message.getSender().getDisplayName())
            .content(message.getContent())
            .type(message.getType().name())
            .isRead(message.isRead())
            .sentAt(message.getSentAt())
            .build();
    }

}
