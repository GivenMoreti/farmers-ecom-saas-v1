package com.example.backend.repositories;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.models.Delivery;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, String> {
    List<Delivery> findByOrderIdOrderByCreatedAtDesc(String orderId);
    List<Delivery> findByDriverIdOrderByCreatedAtDesc(String driverId);
}
