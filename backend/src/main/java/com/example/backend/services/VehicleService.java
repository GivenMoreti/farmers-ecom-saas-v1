package com.example.backend.services;

import java.util.List;
import org.springframework.stereotype.Service;
import com.example.backend.models.Tenant;
import com.example.backend.models.User;
import com.example.backend.models.Vehicle;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.VehicleRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public List<Vehicle> listForFarmer(String userId) {
        return vehicleRepository.findByTenantUserIdOrderByCreatedAtDesc(userId);
    }

    public Vehicle create(String userId, Vehicle request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Tenant tenant = user.getTenant();
        if (tenant == null) {
            throw new IllegalStateException("You must create a farm profile first");
        }

        request.setId(null);
        request.setTenant(tenant);
        return vehicleRepository.save(request);
    }
}
