package com.example.backend.controllers;

import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.dtos.ProductResponse;
import com.example.backend.services.ProductService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping("/public/search")
    public ResponseEntity<Page<ProductResponse>> searchProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(productService.searchProducts(
            category,
            query,
            latitude,
            longitude,
            radiusKm,
            minRating,
            minPrice,
            maxPrice,
            pageable
        ));
    }

    @GetMapping("/farmer/list")
    public ResponseEntity<?> listFarmerProducts(Authentication authentication) {
        try {
            String userId = authentication.getName();
            return ResponseEntity.ok(productService.listFarmerProducts(userId));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body("Unauthorized");
        }
    }

    @PostMapping("/farmer/create")
    public ResponseEntity<?> createProduct(
            @RequestBody ProductRequest request,
            Authentication authentication
    ) {
        try {
            return ResponseEntity.ok(productService.createProduct(request, authentication.getName()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body("Unauthorized");
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(
                ex.getMessage()
            );
        }
    }

    @PostMapping("/farmer/{productId}/toggle")
    public ResponseEntity<?> toggleListing(
            @PathVariable String productId,
            Authentication authentication
    ) {
        try {
            return ResponseEntity.ok(productService.toggleListing(productId, authentication.getName()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body("Unauthorized");
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/farmer/{productId}/mark-sold")
    public ResponseEntity<?> markAsSold(
            @PathVariable String productId,
            Authentication authentication
    ) {
        try {
            return ResponseEntity.ok(productService.markAsSold(productId, authentication.getName()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body("Unauthorized");
        }
    }
}
