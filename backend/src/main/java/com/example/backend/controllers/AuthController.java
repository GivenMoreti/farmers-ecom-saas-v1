package com.example.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.config.JwtService;
import com.example.backend.dtos.AuthRequest;
import com.example.backend.dtos.AuthResponse;
import com.example.backend.models.User;
import com.example.backend.repositories.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
     private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user exists and is active
        if (!user.isActive()) {
            throw new RuntimeException("User account is deactivated");
        }

        String token = jwtService.generateToken(
            user.getId(),
            user.getEmail(),
            user.getRole().name()
        );

        return ResponseEntity.ok(AuthResponse.builder()
            .token(token)
            .userId(user.getId())
            .email(user.getEmail())
            .displayName(user.getDisplayName())
            .role(user.getRole().name())
            .build()
        );
    }

    @PostMapping("/role/select")
    public ResponseEntity<?> selectRole(
            @RequestParam String userId,
            @RequestParam User.UserRole role
    ) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(role);
        userRepository.save(user);

        // Generate new token with updated role
        String token = jwtService.generateToken(
            user.getId(),
            user.getEmail(),
            user.getRole().name()
        );

        return ResponseEntity.ok(AuthResponse.builder()
            .token(token)
            .userId(user.getId())
            .email(user.getEmail())
            .displayName(user.getDisplayName())
            .role(user.getRole().name())
            .build()
        );
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestParam String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(AuthResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .displayName(user.getDisplayName())
            .role(user.getRole().name())
            .build()
        );
    }
}
