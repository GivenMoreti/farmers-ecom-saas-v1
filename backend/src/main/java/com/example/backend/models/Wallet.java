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
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "wallets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Wallet {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(precision = 10, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "total_spent", precision = 10, scale = 2)
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "auto_topup_enabled")
    private boolean autoTopupEnabled = false;

    @Column(name = "auto_topup_threshold", precision = 10, scale = 2)
    private BigDecimal autoTopupThreshold = new BigDecimal("20.00");

    @Column(name = "auto_topup_amount", precision = 10, scale = 2)
    private BigDecimal autoTopupAmount = new BigDecimal("100.00");

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL)
    private List<WalletTransaction> transactions = new ArrayList<>();
}
