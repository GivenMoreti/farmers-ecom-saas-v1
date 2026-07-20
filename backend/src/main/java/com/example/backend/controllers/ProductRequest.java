package com.example.backend.controllers;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.example.backend.models.Product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ProductRequest
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    private String categoryId;
    private String name;
    private String breed;
    private String description;
    private BigDecimal price;
    private Product.PriceUnit priceUnit;
    private BigDecimal dailyListingFee;
    private boolean isListed;
    private List<String> media;
    private Map<String, Object> livestockDetails;
    private Map<String, Object> cropDetails;
}
