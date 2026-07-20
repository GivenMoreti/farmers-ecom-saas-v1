package com.example.backend.repositories;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.models.Vehicle;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, String> {
    List<Vehicle> findByTenantUserIdOrderByCreatedAtDesc(String userId);
    Optional<Vehicle> findByIdAndTenantUserId(String vehicleId, String userId);
}
