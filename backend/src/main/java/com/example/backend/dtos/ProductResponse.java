package com.example.backend.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.example.backend.models.Product;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private String id;
    private String farmerId;
    private String tenantId;
    private String farmName;
    private Double farmerLatitude;
    private Double farmerLongitude;
    private String categoryName;
    private String name;
    private String breed;
    private String description;
    private BigDecimal price;
    private String priceUnit;
    private BigDecimal dailyListingFee;
    private boolean isListed;
    private LocalDateTime listedAt;
    private LocalDateTime soldAt;
    private String status;
    private List<String> media;
    private Map<String, Object> livestockDetails;
    private Map<String, Object> cropDetails;
    private int viewCount;
    private int favoriteCount;
    private Double averageRating;
    private Long reviewCount;
    private Double distanceKm;
    private Double recommendationScore;
    private LocalDateTime createdAt;

    public static ProductResponse fromEntity(Product product) {
        return fromEntity(product, null, null, null, null);
    }

    public static ProductResponse fromEntity(
            Product product,
            Double averageRating,
            Long reviewCount,
            Double distanceKm,
            Double recommendationScore
    ) {
        return ProductResponse.builder()
                .id(product.getId())
                .farmerId(product.getTenant() != null && product.getTenant().getUser() != null
                    ? product.getTenant().getUser().getId()
                    : null)
                .tenantId(product.getTenant() != null ? product.getTenant().getId() : null)
                .farmName(product.getTenant() != null ? product.getTenant().getFarmName() : null)
                .farmerLatitude(product.getTenant() != null ? product.getTenant().getLatitude() : null)
                .farmerLongitude(product.getTenant() != null ? product.getTenant().getLongitude() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .name(product.getName())
                .breed(product.getBreed())
                .description(product.getDescription())
                .price(product.getPrice())
                .priceUnit(product.getPriceUnit() != null ? product.getPriceUnit().name() : null)
                .dailyListingFee(product.getDailyListingFee())
                .isListed(product.isListed())
                .listedAt(product.getListedAt())
                .soldAt(product.getSoldAt())
                .status(product.getStatus() != null ? product.getStatus().name() : null)
                .media(product.getMedia())
                .livestockDetails(product.getLivestockDetails())
                .cropDetails(product.getCropDetails())
                .viewCount(product.getViewCount())
                .favoriteCount(product.getFavoriteCount())
                .averageRating(averageRating)
                .reviewCount(reviewCount)
                .distanceKm(distanceKm)
                .recommendationScore(recommendationScore)
                .createdAt(product.getCreatedAt())
                .build();
    }
}