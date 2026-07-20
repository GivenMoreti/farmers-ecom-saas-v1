package com.example.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.dtos.FarmerProfileRequest;
import com.example.backend.services.FarmerProfileService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/farmer/profile")
@RequiredArgsConstructor
public class FarmerProfileController {

    private final FarmerProfileService farmerProfileService;

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication authentication) {
        try {
            return ResponseEntity.ok(farmerProfileService.getProfile(authentication.getName()));
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> upsertProfile(
            @RequestBody FarmerProfileRequest request,
            Authentication authentication
    ) {
        try {
            return ResponseEntity.ok(farmerProfileService.upsertProfile(authentication.getName(), request));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body(ex.getMessage());
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
