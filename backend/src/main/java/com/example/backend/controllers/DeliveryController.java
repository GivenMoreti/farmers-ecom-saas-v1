package com.example.backend.controllers;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.backend.models.Delivery;
import com.example.backend.services.DeliveryTrackingService;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryTrackingService deliveryTrackingService;

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> listByOrder(@PathVariable String orderId, Authentication authentication) {
        try {
            List<Delivery> deliveries = deliveryTrackingService.listOrderDeliveries(orderId, authentication.getName());
            return ResponseEntity.ok(deliveries);
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body("Unauthorized");
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateDeliveryRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(deliveryTrackingService.create(
                authentication.getName(),
                request.getOrderId(),
                request.getVehicleId(),
                request.getDriverId(),
                request.getPickupAddress(),
                request.getDropoffAddress()
            ));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body("Unauthorized");
        }
    }

    @PutMapping("/{deliveryId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String deliveryId, @RequestBody UpdateDeliveryStatusRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(deliveryTrackingService.updateStatus(deliveryId, request.getStatus(), authentication.getName()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body("Unauthorized");
        }
    }

    @Data
    public static class CreateDeliveryRequest {
        private String orderId;
        private String vehicleId;
        private String driverId;
        private String pickupAddress;
        private String dropoffAddress;
    }

    @Data
    public static class UpdateDeliveryStatusRequest {
        private Delivery.DeliveryStatus status;
    }
}
