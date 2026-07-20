package com.example.backend.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.models.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    Optional<Review> findByOrderId(String orderId);
    List<Review> findByRevieweeIdOrderByCreatedAtDesc(String revieweeId);
    List<Review> findByProductIdOrderByCreatedAtDesc(String productId);
}
