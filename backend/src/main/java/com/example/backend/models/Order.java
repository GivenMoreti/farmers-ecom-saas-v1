package com.example.backend.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id", nullable = false)
    private User farmer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "product_price", precision = 10, scale = 2)
    private BigDecimal productPrice;

    @Column(name = "buyer_service_fee", precision = 10, scale = 2)
    private BigDecimal buyerServiceFee;

    @Column(name = "farmer_commission", precision = 10, scale = 2)
    private BigDecimal farmerCommission;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.CART;

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @Column(name = "delivery_latitude", precision = 10, scale = 8)
    private Double deliveryLatitude;

    @Column(name = "delivery_longitude", precision = 11, scale = 8)
    private Double deliveryLongitude;

    @Column(name = "delivery_instructions")
    private String deliveryInstructions;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private EscrowTransaction escrowTransaction;

    @OneToOne(mappedBy = "order")
    private Review review;

    @OneToMany(mappedBy = "order")
    private List<Delivery> deliveries = new ArrayList<>();

    public enum OrderStatus {
        CART, PENDING_PAYMENT, PAID, ESCROW_HELD, DELIVERED, COMPLETED, CANCELLED, REFUNDED
    }
}
