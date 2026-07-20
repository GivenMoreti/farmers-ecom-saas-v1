package com.example.backend.controllers;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.models.Review;
import com.example.backend.services.ReviewService;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<Review>> listForProduct(@RequestParam String productId) {
        return ResponseEntity.ok(reviewService.listForProduct(productId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateReviewRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(reviewService.create(
                authentication.getName(),
                request.getOrderId(),
                request.getRating(),
                request.getComment()
            ));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body(ex.getMessage());
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @Data
    public static class CreateReviewRequest {
        private String orderId;
        private Integer rating;
        private String comment;
    }
}
