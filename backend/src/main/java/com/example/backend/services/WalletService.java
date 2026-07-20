package com.example.backend.services;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import com.example.backend.models.Wallet;
import com.example.backend.models.WalletTransaction;
import com.example.backend.repositories.WalletRepository;
import com.example.backend.repositories.WalletTransactionRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;

    public Map<String, BigDecimal> getBalanceSummary(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Wallet not found"));

        return Map.of(
            "balance", wallet.getBalance(),
            "totalSpent", wallet.getTotalSpent()
        );
    }

    public List<WalletTransaction> getTransactions(String userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Wallet not found"));

        return transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId());
    }

    public Map<String, String> initiateTopup(BigDecimal amount, String userId) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Top-up amount must be greater than zero");
        }

        walletRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Wallet not found"));

        // Placeholder for payment gateway initiation.
        return Map.of(
            "paymentUrl", "https://ozow.com/pay/...",
            "transactionId", "txn_" + System.currentTimeMillis()
        );
    }
}
