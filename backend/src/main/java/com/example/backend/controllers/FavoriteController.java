package com.example.backend.controllers;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.models.Favorite;
import com.example.backend.services.FavoriteService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public ResponseEntity<List<Favorite>> list(Authentication authentication) {
        return ResponseEntity.ok(favoriteService.listForUser(authentication.getName()));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<Favorite> add(@PathVariable String productId, Authentication authentication) {
        return ResponseEntity.ok(favoriteService.add(authentication.getName(), productId));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> remove(@PathVariable String productId, Authentication authentication) {
        favoriteService.remove(authentication.getName(), productId);
        return ResponseEntity.ok(Map.of("removed", true));
    }
}
