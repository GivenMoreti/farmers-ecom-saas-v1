package com.example.backend.repositories;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.models.Product;
import com.example.backend.models.Product.ProductStatus;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    Page<Product> findByIsListedTrueAndStatus(ProductStatus available, Pageable pageable);
    // Define methods for product-related database operations

    List<Product> findByIsListedTrueAndStatus(ProductStatus available);

    List<Product> findByTenantUserIdOrderByCreatedAtDesc(String userId);
}