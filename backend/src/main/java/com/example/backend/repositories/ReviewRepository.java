package com.example.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.example.backend.models.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    Optional<Review> findByOrderId(String orderId);
    List<Review> findByRevieweeIdOrderByCreatedAtDesc(String revieweeId);
    List<Review> findByProductIdOrderByCreatedAtDesc(String productId);

    @Query("""
        select r.reviewee.id as farmerId, avg(r.rating) as averageRating, count(r.id) as reviewCount
        from Review r
        where r.reviewee.id in :farmerIds and r.isPublic = true
        group by r.reviewee.id
    """)
    List<FarmerRatingSummary> summarizeRatingsByFarmerIds(@Param("farmerIds") Set<String> farmerIds);

    interface FarmerRatingSummary {
        String getFarmerId();
        Double getAverageRating();
        Long getReviewCount();
    }
}
