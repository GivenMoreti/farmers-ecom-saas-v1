package com.example.backend.controllers;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.models.Wallet;
import com.example.backend.models.WalletTransaction;
import com.example.backend.repositories.WalletRepository;
import com.example.backend.repositories.WalletTransactionRepository;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(Authentication authentication) {
        String userId = authentication.getName();
        Wallet wallet = walletRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Wallet not found"));

        return ResponseEntity.ok(Map.of(
            "balance", wallet.getBalance(),
            "totalSpent", wallet.getTotalSpent()
        ));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransaction>> getTransactions(Authentication authentication) {
        String userId = authentication.getName();
        Wallet wallet = walletRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Wallet not found"));

        return ResponseEntity.ok(transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId()));
    }

    @PostMapping("/topup/initiate")
    public ResponseEntity<?> initiateTopup(
            @RequestParam BigDecimal amount,
            Authentication authentication
    ) {
        // Would integrate with Ozow here
        // Return a payment URL or session ID
        return ResponseEntity.ok(Map.of(
            "paymentUrl", "https://ozow.com/pay/...",
            "transactionId", "txn_123456"
        ));
    }
}
