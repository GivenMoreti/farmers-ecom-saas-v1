package com.example.backend.controllers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
import com.example.backend.config.JwtService;
import com.example.backend.dtos.ProductResponse;
import com.example.backend.models.Product;
import com.example.backend.models.User;
import com.example.backend.models.Wallet;
import com.example.backend.repositories.CategoryRepository;
import com.example.backend.repositories.ProductRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.WalletRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final JwtService jwtService;
    private final CategoryRepository categoryRepository;

    @GetMapping("/public/search")
    public ResponseEntity<Page<ProductResponse>> searchProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        // Implementation would use custom query with geospatial search
        // Simplified version:
        Page<Product> products = productRepository.findByIsListedTrueAndStatus(
            Product.ProductStatus.AVAILABLE,
            pageable
        );
        return ResponseEntity.ok(products.map(ProductResponse::fromEntity));
    }

    @PostMapping("/farmer/create")
    public ResponseEntity<?> createProduct(
            @RequestBody ProductRequest request,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTenant() == null) {
            return ResponseEntity.badRequest().body("You must create a farm profile first");
        }

        // Check if user has enough balance to list
        User wallet = walletRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Wallet not found"));

        BigDecimal minBalance = request.getDailyListingFee() != null 
            ? request.getDailyListingFee().multiply(BigDecimal.valueOf(3))
            : BigDecimal.valueOf(3);

        if (wallet.getBalance().compareTo(minBalance) < 0) {
            return ResponseEntity.badRequest().body(
                "Insufficient balance. You need at least R" + minBalance + " to list this product."
            );
        }

        Product product = Product.builder()
            .tenant(user.getTenant())
            .category(request.getCategoryId() != null ? categoryRepository.findById(request.getCategoryId()).orElse(null) : null)
            .name(request.getName())
            .breed(request.getBreed())
            .description(request.getDescription())
            .price(request.getPrice())
            .priceUnit(request.getPriceUnit())
            .dailyListingFee(request.getDailyListingFee() != null ? request.getDailyListingFee() : BigDecimal.ONE)
            .isListed(request.isListed())
            .listedAt(request.isListed() ? LocalDateTime.now() : null)
            .status(Product.ProductStatus.AVAILABLE)
            .livestockDetails(request.getLivestockDetails())
            .cropDetails(request.getCropDetails())
            .media(request.getMedia())
            .build();

        productRepository.save(product);
        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    @PostMapping("/farmer/{productId}/toggle")
    public ResponseEntity<?> toggleListing(
            @PathVariable String productId,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        // Verify ownership
        if (!product.getTenant().getUser().getId().equals(userId)) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        boolean newStatus = !product.isListed();

        if (newStatus) {
            // Listing the product - check wallet balance
            Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

            BigDecimal minBalance = product.getDailyListingFee().multiply(BigDecimal.valueOf(3));
            if (wallet.getBalance().compareTo(minBalance) < 0) {
                return ResponseEntity.badRequest().body(
                    "Insufficient balance. You need at least R" + minBalance + " to list this product."
                );
            }
            product.setListedAt(LocalDateTime.now());
            product.setUnlistedAt(null);
        } else {
            product.setUnlistedAt(LocalDateTime.now());
        }

        product.setListed(newStatus);
        productRepository.save(product);

        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }

    @PostMapping("/farmer/{productId}/mark-sold")
    public ResponseEntity<?> markAsSold(
            @PathVariable String productId,
            Authentication authentication
    ) {
        String userId = authentication.getName();
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getTenant().getUser().getId().equals(userId)) {
            return ResponseEntity.status(403).body("Unauthorized");
        }

        product.setSoldAt(LocalDateTime.now());
        product.setListed(false);
        product.setStatus(Product.ProductStatus.SOLD);
        productRepository.save(product);

        return ResponseEntity.ok(ProductResponse.fromEntity(product));
    }
}
