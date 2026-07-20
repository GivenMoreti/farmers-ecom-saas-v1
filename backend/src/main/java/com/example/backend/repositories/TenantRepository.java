package com.example.backend.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.models.Tenant;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, String> {
    Optional<Tenant> findByUserId(String userId);
    boolean existsByUserId(String userId);
}
