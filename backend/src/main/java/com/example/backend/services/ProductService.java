package com.example.backend.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.example.backend.controllers.ProductRequest;
import com.example.backend.dtos.ProductResponse;
import com.example.backend.models.Product;
import com.example.backend.models.User;
import com.example.backend.models.Wallet;
import com.example.backend.repositories.CategoryRepository;
import com.example.backend.repositories.ProductRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.WalletRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;

    public Page<ProductResponse> searchProducts(Pageable pageable) {
        Page<Product> products = productRepository.findByIsListedTrueAndStatus(
            Product.ProductStatus.AVAILABLE,
            pageable
        );
        return products.map(ProductResponse::fromEntity);
    }

    public List<ProductResponse> listFarmerProducts(String userId) {
        return productRepository.findByTenantUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(ProductResponse::fromEntity)
            .toList();
    }

    public ProductResponse createProduct(ProductRequest request, String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getTenant() == null) {
            throw new IllegalStateException("You must create a farm profile first");
        }

        Wallet wallet = walletRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Wallet not found"));

        BigDecimal minBalance = request.getDailyListingFee() != null
            ? request.getDailyListingFee().multiply(BigDecimal.valueOf(3))
            : BigDecimal.valueOf(3);

        if (wallet.getBalance().compareTo(minBalance) < 0) {
            throw new IllegalStateException(
                "Insufficient balance. You need at least R" + minBalance + " to list this product."
            );
        }

        Product product = Product.builder()
            .tenant(user.getTenant())
            .category(request.getCategoryId() != null
                ? categoryRepository.findById(request.getCategoryId()).orElse(null)
                : null)
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
        return ProductResponse.fromEntity(product);
    }

    public ProductResponse toggleListing(String productId, String userId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getTenant().getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized");
        }

        boolean newStatus = !product.isListed();

        if (newStatus) {
            Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

            BigDecimal minBalance = product.getDailyListingFee().multiply(BigDecimal.valueOf(3));
            if (wallet.getBalance().compareTo(minBalance) < 0) {
                throw new IllegalStateException(
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

        return ProductResponse.fromEntity(product);
    }

    public ProductResponse markAsSold(String productId, String userId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getTenant().getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized");
        }

        product.setSoldAt(LocalDateTime.now());
        product.setListed(false);
        product.setStatus(Product.ProductStatus.SOLD);
        productRepository.save(product);

        return ProductResponse.fromEntity(product);
    }
}
