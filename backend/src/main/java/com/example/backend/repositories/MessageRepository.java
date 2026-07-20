package com.example.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.models.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message,String>{

    void markAllAsRead(String roomId, String userId);

}
