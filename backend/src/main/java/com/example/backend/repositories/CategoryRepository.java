package com.example.backend.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend.models.Category;

/**
 * categoryRepository
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {
    Optional<Category> findById(String id);

}
