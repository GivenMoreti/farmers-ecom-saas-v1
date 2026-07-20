package com.example.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.dtos.AuthRequest;
import com.example.backend.dtos.AuthResponse;
import com.example.backend.models.User;
import com.example.backend.services.AuthService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(authService.googleLogin(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/role/select")
    public ResponseEntity<?> selectRole(
            @RequestParam User.UserRole role,
            Authentication authentication
    ) {
        try {
            return ResponseEntity.ok(authService.selectRole(authentication.getName(), role));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(authService.currentUser(authentication.getName()));
    }
}
