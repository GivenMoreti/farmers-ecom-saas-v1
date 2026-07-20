package com.example.backend.models;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tenants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "farm_name", nullable = false)
    private String farmName;

    @Column(name = "farm_description")
    private String farmDescription;

    @Column(name = "registration_number")
    private String registrationNumber;

    private String address;

    private Double latitude;

    private Double longitude;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "is_verified")
    private boolean verified = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL)
    private List<Product> products = new ArrayList<>();

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL)
    private List<Vehicle> vehicles = new ArrayList<>();
}
