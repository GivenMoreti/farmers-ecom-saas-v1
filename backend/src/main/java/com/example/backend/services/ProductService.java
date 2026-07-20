package com.example.backend.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.backend.controllers.ProductRequest;
import com.example.backend.dtos.ProductResponse;
import com.example.backend.models.Product;
import com.example.backend.models.User;
import com.example.backend.models.Wallet;
import com.example.backend.repositories.CategoryRepository;
import com.example.backend.repositories.ProductRepository;
import com.example.backend.repositories.ReviewRepository;
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
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(
            String category,
            String query,
            Double latitude,
            Double longitude,
            Double radiusKm,
            Double minRating,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Pageable pageable
    ) {
        List<Product> listedProducts = productRepository.findByIsListedTrueAndStatus(
            Product.ProductStatus.AVAILABLE
        );

        Set<String> farmerIds = listedProducts.stream()
            .map(product -> product.getTenant().getUser().getId())
            .collect(java.util.stream.Collectors.toSet());

        Map<String, ReviewRepository.FarmerRatingSummary> ratingsByFarmer = new HashMap<>();
        if (!farmerIds.isEmpty()) {
            List<ReviewRepository.FarmerRatingSummary> summaries = reviewRepository.summarizeRatingsByFarmerIds(farmerIds);
            for (ReviewRepository.FarmerRatingSummary summary : summaries) {
                ratingsByFarmer.put(summary.getFarmerId(), summary);
            }
        }

        List<ScoredProduct> filteredAndScored = listedProducts.stream()
            .map(product -> toScoredProduct(product, query, category, latitude, longitude, radiusKm, ratingsByFarmer))
            .filter(scored -> matchesFilters(scored, category, query, radiusKm, minRating, minPrice, maxPrice))
            .sorted(Comparator.comparing(ScoredProduct::score).reversed())
            .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filteredAndScored.size());

        if (start >= filteredAndScored.size()) {
            return new PageImpl<>(List.of(), pageable, filteredAndScored.size());
        }

        List<ProductResponse> content = filteredAndScored.subList(start, end)
            .stream()
            .map(scored -> ProductResponse.fromEntity(
                scored.product(),
                scored.averageRating(),
                scored.reviewCount(),
                scored.distanceKm(),
                scored.score()
            ))
            .toList();

        return new PageImpl<>(content, pageable, filteredAndScored.size());
    }

    public List<ProductResponse> listFarmerProducts(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.UserRole.FARMER) {
            throw new SecurityException("Only farmers can access this endpoint");
        }

        return productRepository.findByTenantUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(ProductResponse::fromEntity)
            .toList();
    }

    public ProductResponse createProduct(ProductRequest request, String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.UserRole.FARMER) {
            throw new SecurityException("Only farmers can create listings");
        }

        if (user.getTenant() == null) {
            throw new IllegalStateException("You must create a farm profile first");
        }

        if (request.getCategoryId() == null || request.getCategoryId().isBlank()) {
            throw new IllegalStateException("Category is required");
        }

        BigDecimal listingFee = request.getDailyListingFee() != null ? request.getDailyListingFee() : BigDecimal.ONE;

        if (request.isListed()) {
            Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

            BigDecimal minBalance = listingFee.multiply(BigDecimal.valueOf(3));
            if (wallet.getBalance().compareTo(minBalance) < 0) {
                throw new IllegalStateException(
                    "Insufficient balance. You need at least R" + minBalance + " to list this product."
                );
            }
        }

        Product product = Product.builder()
            .tenant(user.getTenant())
            .category(categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found")))
            .name(request.getName())
            .breed(request.getBreed())
            .description(request.getDescription())
            .price(request.getPrice())
            .priceUnit(request.getPriceUnit())
            .dailyListingFee(listingFee)
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

        if (product.getTenant().getUser().getRole() != User.UserRole.FARMER) {
            throw new SecurityException("Only farmers can manage listings");
        }

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

        if (product.getTenant().getUser().getRole() != User.UserRole.FARMER) {
            throw new SecurityException("Only farmers can mark listings as sold");
        }

        if (!product.getTenant().getUser().getId().equals(userId)) {
            throw new SecurityException("Unauthorized");
        }

        product.setSoldAt(LocalDateTime.now());
        product.setListed(false);
        product.setStatus(Product.ProductStatus.SOLD);
        productRepository.save(product);

        return ProductResponse.fromEntity(product);
    }

    private ScoredProduct toScoredProduct(
            Product product,
            String query,
            String category,
            Double latitude,
            Double longitude,
            Double radiusKm,
            Map<String, ReviewRepository.FarmerRatingSummary> ratingsByFarmer
    ) {
        String farmerId = product.getTenant().getUser().getId();
        ReviewRepository.FarmerRatingSummary ratingSummary = ratingsByFarmer.get(farmerId);

        double avgRating = ratingSummary == null || ratingSummary.getAverageRating() == null
            ? 0.0
            : ratingSummary.getAverageRating();
        long reviewCount = ratingSummary == null || ratingSummary.getReviewCount() == null
            ? 0L
            : ratingSummary.getReviewCount();

        Double distanceKm = calculateDistanceKm(
            latitude,
            longitude,
            product.getTenant().getLatitude(),
            product.getTenant().getLongitude()
        );

        double productScore = productMatchScore(product, query, category);
        double locationScore = locationScore(distanceKm, radiusKm);
        double reviewScore = avgRating / 5.0;
        double recommendationScore = (0.45 * productScore) + (0.30 * locationScore) + (0.25 * reviewScore);

        return new ScoredProduct(product, avgRating, reviewCount, distanceKm, recommendationScore);
    }

    private boolean matchesFilters(
            ScoredProduct scored,
            String category,
            String query,
            Double radiusKm,
            Double minRating,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {
        Product product = scored.product();

        if (category != null && !category.isBlank()) {
            String categoryName = product.getCategory() != null ? product.getCategory().getName() : "";
            if (!categoryName.toLowerCase().contains(category.toLowerCase())) {
                return false;
            }
        }

        if (query != null && !query.isBlank()) {
            String searchable = String.join(" ",
                nullSafe(product.getName()),
                nullSafe(product.getBreed()),
                nullSafe(product.getDescription()),
                product.getCategory() == null ? "" : nullSafe(product.getCategory().getName()),
                product.getTenant() == null ? "" : nullSafe(product.getTenant().getFarmName())
            ).toLowerCase();

            if (!searchable.contains(query.toLowerCase())) {
                return false;
            }
        }

        if (minPrice != null && product.getPrice().compareTo(minPrice) < 0) {
            return false;
        }

        if (maxPrice != null && product.getPrice().compareTo(maxPrice) > 0) {
            return false;
        }

        if (radiusKm != null && scored.distanceKm() != null && scored.distanceKm() > radiusKm) {
            return false;
        }

        if (minRating != null && scored.averageRating() < minRating) {
            return false;
        }

        return true;
    }

    private double productMatchScore(Product product, String query, String category) {
        if ((query == null || query.isBlank()) && (category == null || category.isBlank())) {
            return 1.0;
        }

        double score = 0.0;
        if (query != null && !query.isBlank()) {
            String q = query.toLowerCase();
            if (nullSafe(product.getName()).toLowerCase().contains(q)) {
                score += 0.5;
            }
            if (nullSafe(product.getBreed()).toLowerCase().contains(q)) {
                score += 0.2;
            }
            if (nullSafe(product.getDescription()).toLowerCase().contains(q)) {
                score += 0.2;
            }
            if (product.getCategory() != null && nullSafe(product.getCategory().getName()).toLowerCase().contains(q)) {
                score += 0.1;
            }
        }

        if (category != null && !category.isBlank()) {
            String categoryName = product.getCategory() != null ? product.getCategory().getName() : "";
            if (categoryName.toLowerCase().contains(category.toLowerCase())) {
                score += 0.3;
            }
        }

        return Math.min(score, 1.0);
    }

    private double locationScore(Double distanceKm, Double radiusKm) {
        if (distanceKm == null) {
            return 0.4;
        }

        double normalizationDistance = radiusKm != null && radiusKm > 0 ? radiusKm : 200.0;
        return Math.max(0.0, 1.0 - (distanceKm / normalizationDistance));
    }

    private Double calculateDistanceKm(
            Double lat1,
            Double lon1,
            Double lat2,
            Double lon2
    ) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return null;
        }

        final double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private String nullSafe(String value) {
        return value == null ? "" : value;
    }

    private record ScoredProduct(
        Product product,
        double averageRating,
        long reviewCount,
        Double distanceKm,
        double score
    ) {}
}
