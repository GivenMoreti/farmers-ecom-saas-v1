package com.example.backend.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.example.backend.models.Product;
import com.example.backend.models.Wallet;
import com.example.backend.models.WalletTransaction;
import com.example.backend.repositories.ProductRepository;
import com.example.backend.repositories.WalletRepository;
import com.example.backend.repositories.WalletTransactionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ListingScheduler {
    private final ProductRepository productRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 0 * * ?") // Runs at midnight every day
    @Transactional
    public void deductDailyListingFees() {
        // Find all active listed products
        List<Product> activeProducts = productRepository.findByIsListedTrueAndStatus(
            Product.ProductStatus.AVAILABLE
        );

        for (Product product : activeProducts) {
            Wallet wallet = walletRepository.findByUserId(product.getTenant().getUser().getId())
                .orElse(null);

            if (wallet == null) continue;

            BigDecimal dailyFee = product.getDailyListingFee();

            if (wallet.getBalance().compareTo(dailyFee) >= 0) {
                // Deduct fee
                wallet.setBalance(wallet.getBalance().subtract(dailyFee));
                wallet.setTotalSpent(wallet.getTotalSpent().add(dailyFee));
                walletRepository.save(wallet);

                // Log transaction
                WalletTransaction transaction = WalletTransaction.builder()
                    .wallet(wallet)
                    .product(product)
                    .type(WalletTransaction.TransactionType.LISTING_FEE)
                    .amount(dailyFee.negate())
                    .balanceAfter(wallet.getBalance())
                    .description("Daily listing fee for: " + product.getName())
                    .status(WalletTransaction.TransactionStatus.COMPLETED)
                    .build();
                transactionRepository.save(transaction);

            } else {
                // Insufficient funds - auto-unlist
                product.setListed(false);
                product.setUnlistedAt(LocalDateTime.now());
                productRepository.save(product);

                // Send notification
                notificationService.sendEmail(
                    product.getTenant().getUser().getEmail(),
                    "Your product '" + product.getName() + "' was unlisted due to low balance",
                    "Please top up your wallet to relist this product."
                );
            }
        }
    }
}
