package com.example.backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {

        private String email;
        private String provider; // "google" or "email"
        private String idToken; // Google ID token
    
}
