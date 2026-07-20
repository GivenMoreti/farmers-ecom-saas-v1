package com.example.backend.controllers;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.models.WalletTransaction;
import com.example.backend.services.WalletService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {
    private final WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(walletService.getBalanceSummary(userId));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransaction>> getTransactions(Authentication authentication) {
        String userId = authentication.getName();
        return ResponseEntity.ok(walletService.getTransactions(userId));
    }

    @PostMapping("/topup/initiate")
    public ResponseEntity<?> initiateTopup(
            @RequestParam BigDecimal amount,
            Authentication authentication
    ) {
        return ResponseEntity.ok(walletService.initiateTopup(amount, authentication.getName()));
    }
}
