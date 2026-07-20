package com.example.backend.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String name;

    private String breed;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_unit")
    private PriceUnit priceUnit = PriceUnit.UNIT;

    @Column(name = "daily_listing_fee", precision = 10, scale = 2)
    private BigDecimal dailyListingFee = BigDecimal.ONE;

    @Column(name = "is_listed")
    private boolean isListed = false;

    @Column(name = "listed_at")
    private LocalDateTime listedAt;

    @Column(name = "sold_at")
    private LocalDateTime soldAt;

    @Column(name = "unlisted_at")
    private LocalDateTime unlistedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> media = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private ProductStatus status = ProductStatus.AVAILABLE;

    @Column(name = "view_count")
    private int viewCount = 0;

    @Column(name = "favorite_count")
    private int favoriteCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Livestock-specific fields (stored as JSON to avoid extension tables)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private Map<String, Object> livestockDetails;

    // Crop-specific fields (stored as JSON to avoid extension tables)
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    private Map<String, Object> cropDetails;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<Order> orders = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<Favorite> favorites = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ChatRoom> chatRooms = new ArrayList<>();

    public enum PriceUnit {
        UNIT, KG, TON
    }

    public enum ProductStatus {
        AVAILABLE, SOLD, UNLISTED, DELETED
    }
}
