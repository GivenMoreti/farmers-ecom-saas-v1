package com.example.backend.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.models.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message,String>{

        List<Message> findByRoomIdOrderBySentAtAsc(String roomId);

        @Modifying
        @Transactional
        @Query("""
                        update Message m
                             set m.isRead = true
                         where m.room.id = :roomId
                             and m.sender.id <> :userId
                        """)
        void markAllAsRead(@Param("roomId") String roomId, @Param("userId") String userId);

}
