package com.example.backend.controllers;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.models.Vehicle;
import com.example.backend.services.VehicleService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping("/farmer")
    public ResponseEntity<List<Vehicle>> list(Authentication authentication) {
        return ResponseEntity.ok(vehicleService.listForFarmer(authentication.getName()));
    }

    @PostMapping("/farmer")
    public ResponseEntity<?> create(@RequestBody Vehicle request, Authentication authentication) {
        try {
            return ResponseEntity.ok(vehicleService.create(authentication.getName(), request));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
