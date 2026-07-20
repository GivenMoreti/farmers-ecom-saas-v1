package com.example.backend.services;

import java.util.List;
import org.springframework.stereotype.Service;
import com.example.backend.models.Order;
import com.example.backend.models.Review;
import com.example.backend.models.User;
import com.example.backend.repositories.OrderRepository;
import com.example.backend.repositories.ReviewRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;

    public List<Review> listForProduct(String productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public Review create(String reviewerId, String orderId, Integer rating, String comment) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getBuyer().getId().equals(reviewerId)) {
            throw new SecurityException("Only buyer can review this order");
        }
        if (reviewRepository.findByOrderId(orderId).isPresent()) {
            throw new IllegalStateException("Order already reviewed");
        }

        User reviewee = order.getFarmer();

        Review review = Review.builder()
            .order(order)
            .reviewer(order.getBuyer())
            .reviewee(reviewee)
            .product(order.getProduct())
            .rating(rating)
            .comment(comment)
            .isPublic(true)
            .build();

        return reviewRepository.save(review);
    }
}
