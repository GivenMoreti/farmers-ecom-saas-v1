package com.example.backend.services;

import java.io.IOException;
import java.math.BigDecimal;
import java.security.GeneralSecurityException;
import java.util.Collections;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
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

    private static final BigDecimal LAUNCH_TRIAL_CREDIT = new BigDecimal("100.00");

    private final UserRepository userRepository;
    private final GoogleAccountRepository googleAccountRepository;
    private final WalletRepository walletRepository;
    private final JwtService jwtService;

    @Value("${app.google.client-id}")
    private String googleClientId;

    private GoogleIdTokenVerifier googleIdTokenVerifier;

    @PostConstruct
    private void init() throws GeneralSecurityException, IOException {
        googleIdTokenVerifier = new GoogleIdTokenVerifier.Builder(
                GoogleNetHttpTransport.newTrustedTransport(), GsonFactory.getDefaultInstance())
            .setAudience(Collections.singletonList(googleClientId))
            .build();
    }

    public AuthResponse googleLogin(AuthRequest request) {
        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            throw new IllegalArgumentException("Missing idToken");
        }

        // This verify() call is the trust boundary: it checks the token's signature
        // against Google's public keys and that the audience matches our client id.
        // Never trust a decoded-but-unverified JWT payload from the client.
        GoogleIdToken idToken;
        try {
            idToken = googleIdTokenVerifier.verify(request.getIdToken());
        } catch (GeneralSecurityException | IOException | IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid Google token", ex);
        }
        if (idToken == null) {
            throw new IllegalArgumentException("Invalid Google token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String googleId = payload.getSubject();
        String picture = (String) payload.get("picture");

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Token payload is missing email");
        }

        String rawName = (String) payload.get("name");
        final String name = (rawName == null || rawName.isBlank()) ? email : rawName;

        User user = userRepository.findByEmail(email)
            .orElseGet(() -> userRepository.save(User.builder()
                .email(email)
                .displayName(name)
                .role(User.UserRole.BUYER)
                .active(true)
                .build()));

        // Launch trial credit: wallet top-ups aren't wired to a real payment
        // gateway yet, so every new user starts with enough balance to try
        // listing/ordering without hitting a dead end on day one.
        walletRepository.findByUserId(user.getId())
            .orElseGet(() -> walletRepository.save(Wallet.builder()
                .user(user)
                .balance(LAUNCH_TRIAL_CREDIT)
                .build()));

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

        if (role != User.UserRole.BUYER && role != User.UserRole.FARMER) {
            throw new IllegalArgumentException("Only BUYER or FARMER roles can be selected.");
        }

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
}
