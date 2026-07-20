package com.example.backend.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * NotificationService
 */
@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public void sendEmail(String email, String subject, String body) {
        // Intentionally non-blocking placeholder until SMTP integration is configured.
        log.info("Email queued (mock): to={}, subject={}, body={}", email, subject, body);
    }

}
