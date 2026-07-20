package com.example.backend.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "escrow_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EscrowTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(name = "held_amount", precision = 10, scale = 2)
    private BigDecimal heldAmount;

    @Column(name = "buyer_fee_held", precision = 10, scale = 2)
    private BigDecimal buyerFeeHeld;

    @Column(name = "farmer_commission_held", precision = 10, scale = 2)
    private BigDecimal farmerCommissionHeld;

    @Column(name = "platform_revenue", precision = 10, scale = 2)
    private BigDecimal platformRevenue;

    @Enumerated(EnumType.STRING)
    private EscrowStatus status = EscrowStatus.PENDING;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EscrowStatus {
        PENDING, HELD, RELEASED_TO_FARMER, RELEASED_TO_PLATFORM, REFUNDED
    }
}
