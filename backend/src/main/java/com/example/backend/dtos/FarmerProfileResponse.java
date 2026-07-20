package com.example.backend.dtos;

import com.example.backend.models.Tenant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FarmerProfileResponse {
    private String tenantId;
    private String userId;
    private String farmName;
    private String farmDescription;
    private String registrationNumber;
    private String address;
    private Double latitude;
    private Double longitude;
    private String contactPhone;
    private String logoUrl;
    private boolean verified;

    public static FarmerProfileResponse fromEntity(Tenant tenant) {
        return FarmerProfileResponse.builder()
            .tenantId(tenant.getId())
            .userId(tenant.getUser() != null ? tenant.getUser().getId() : null)
            .farmName(tenant.getFarmName())
            .farmDescription(tenant.getFarmDescription())
            .registrationNumber(tenant.getRegistrationNumber())
            .address(tenant.getAddress())
            .latitude(tenant.getLatitude())
            .longitude(tenant.getLongitude())
            .contactPhone(tenant.getContactPhone())
            .logoUrl(tenant.getLogoUrl())
            .verified(tenant.isVerified())
            .build();
    }
}
