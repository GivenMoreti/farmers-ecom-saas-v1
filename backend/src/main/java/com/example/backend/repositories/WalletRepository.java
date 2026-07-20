package com.example.backend.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.models.Wallet;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, String> {

    Optional<Wallet> findByUserId(String userId);

  
    // Define methods for product-related database operations
}