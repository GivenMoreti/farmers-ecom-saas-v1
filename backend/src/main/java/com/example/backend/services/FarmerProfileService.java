package com.example.backend.services;

import org.springframework.stereotype.Service;
import com.example.backend.dtos.FarmerProfileRequest;
import com.example.backend.dtos.FarmerProfileResponse;
import com.example.backend.models.Tenant;
import com.example.backend.models.User;
import com.example.backend.repositories.TenantRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FarmerProfileService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;

    public FarmerProfileResponse getProfile(String userId) {
        Tenant tenant = tenantRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Farmer profile not found"));

        return FarmerProfileResponse.fromEntity(tenant);
    }

    public FarmerProfileResponse upsertProfile(String userId, FarmerProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.UserRole.FARMER) {
            throw new SecurityException("Only farmers can manage farm profiles");
        }

        if (request.getFarmName() == null || request.getFarmName().isBlank()) {
            throw new IllegalStateException("Farm name is required");
        }

        Tenant tenant = tenantRepository.findByUserId(userId)
            .orElseGet(() -> Tenant.builder().user(user).verified(false).build());

        tenant.setFarmName(request.getFarmName().trim());
        tenant.setFarmDescription(request.getFarmDescription());
        tenant.setRegistrationNumber(request.getRegistrationNumber());
        tenant.setAddress(request.getAddress());
        tenant.setLatitude(request.getLatitude());
        tenant.setLongitude(request.getLongitude());
        tenant.setContactPhone(request.getContactPhone());
        tenant.setLogoUrl(request.getLogoUrl());

        Tenant saved = tenantRepository.save(tenant);
        return FarmerProfileResponse.fromEntity(saved);
    }
}
