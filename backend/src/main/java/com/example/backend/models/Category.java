package com.example.backend.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Builder;

/**
 * Category
 */

@Entity
@Table(name = "categories")
@Builder
public record Category(String categoryId, String name, String description){};
