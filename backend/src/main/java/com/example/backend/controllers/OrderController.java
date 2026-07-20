package com.example.backend.controllers;

import java.math.BigDecimal;
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
import com.example.backend.models.Order;
import com.example.backend.services.OrderService;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/buyer")
    public ResponseEntity<List<Order>> buyerOrders(Authentication authentication) {
        return ResponseEntity.ok(orderService.listBuyerOrders(authentication.getName()));
    }

    @GetMapping("/farmer")
    public ResponseEntity<List<Order>> farmerOrders(Authentication authentication) {
        return ResponseEntity.ok(orderService.listFarmerOrders(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<Order> create(@RequestBody CreateOrderRequest request, Authentication authentication) {
        return ResponseEntity.ok(orderService.createOrder(
            authentication.getName(),
            request.getProductId(),
            request.getDeliveryAddress(),
            request.isFarmerDeliverySelected(),
            request.getFarmerDeliveryFee(),
            request.getDeliveryInstructions()
        ));
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String orderId, @RequestBody UpdateOrderStatusRequest request, Authentication authentication) {
        try {
            return ResponseEntity.ok(orderService.updateStatus(orderId, request.getStatus(), authentication.getName()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body("Unauthorized");
        }
    }

    @Data
    public static class CreateOrderRequest {
        private String productId;
        private String deliveryAddress;
        private String deliveryInstructions;
        private boolean farmerDeliverySelected;
        private BigDecimal farmerDeliveryFee;
    }

    @Data
    public static class UpdateOrderStatusRequest {
        private Order.OrderStatus status;
    }
}
