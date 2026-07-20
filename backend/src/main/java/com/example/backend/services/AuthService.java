package com.example.backend.services;

import java.util.Base64;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import com.example.backend.config.JwtService;
import com.example.backend.dtos.AuthRequest;
import com.example.backend.dtos.AuthResponse;
import com.example.backend.models.GoogleAccount;
import com.example.backend.models.User;
import com.example.backend.models.Wallet;
import com.example.backend.repositories.GoogleAccountRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.WalletRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final GoogleAccountRepository googleAccountRepository;
    private final WalletRepository walletRepository;
    private final JwtService jwtService;

    public AuthResponse googleLogin(AuthRequest request) {
        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            throw new IllegalArgumentException("Missing idToken");
        }

        Map<String, Object> payload = decodeJwtPayload(request.getIdToken());
        String email = (String) payload.get("email");
        String name = (String) payload.getOrDefault("name", email);
        String googleId = (String) payload.get("sub");
        String picture = (String) payload.get("picture");

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Token payload is missing email");
        }

        User user = userRepository.findByEmail(email)
            .orElseGet(() -> userRepository.save(User.builder()
                .email(email)
                .displayName(name)
                .role(User.UserRole.BUYER)
                .active(true)
                .build()));

        walletRepository.findByUserId(user.getId())
            .orElseGet(() -> walletRepository.save(Wallet.builder().user(user).build()));

        if (googleId != null && !googleId.isBlank()) {
            GoogleAccount account = googleAccountRepository.findByGoogleId(googleId)
                .orElseGet(() -> googleAccountRepository.findByEmail(email)
                    .orElse(GoogleAccount.builder().user(user).build()));

            account.setUser(user);
            account.setGoogleId(googleId);
            account.setEmail(email);
            account.setName(name);
            account.setPictureUrl(picture);
            googleAccountRepository.save(account);
        }

        return buildAuthResponse(user, true);
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isActive()) {
            throw new RuntimeException("User account is deactivated");
        }

        return buildAuthResponse(user, true);
    }

    public AuthResponse selectRole(String userId, User.UserRole role) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(role);
        userRepository.save(user);
        return buildAuthResponse(user, true);
    }

    public AuthResponse currentUser(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return buildAuthResponse(user, false);
    }

    private AuthResponse buildAuthResponse(User user, boolean includeToken) {
        AuthResponse.AuthResponseBuilder builder = AuthResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .displayName(user.getDisplayName())
            .role(user.getRole().name());

        if (includeToken) {
            builder.token(jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name()));
        }

        return builder.build();
    }

    private Map<String, Object> decodeJwtPayload(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length < 2) {
                throw new IllegalArgumentException("Invalid token");
            }
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            String payload = new String(decoded);
            return Map.of(
                "email", extractJsonValue(payload, "email"),
                "name", extractJsonValue(payload, "name"),
                "sub", extractJsonValue(payload, "sub"),
                "picture", extractJsonValue(payload, "picture")
            );
        } catch (Exception ex) {
            throw new RuntimeException("Invalid google token payload", ex);
        }
    }

    private String extractJsonValue(String json, String key) {
        Pattern pattern = Pattern.compile("\\\"" + key + "\\\"\\s*:\\s*\\\"([^\\\"]*)\\\"");
        Matcher matcher = pattern.matcher(json);
        return matcher.find() ? matcher.group(1) : null;
    }
}
