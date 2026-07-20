package com.example.backend.services;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import com.example.backend.models.Delivery;
import com.example.backend.models.Order;
import com.example.backend.models.User;
import com.example.backend.models.Vehicle;
import com.example.backend.repositories.DeliveryRepository;
import com.example.backend.repositories.OrderRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.VehicleRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeliveryTrackingService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public List<Delivery> listOrderDeliveries(String orderId, String actorId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getBuyer().getId().equals(actorId) && !order.getFarmer().getId().equals(actorId)) {
            throw new SecurityException("Unauthorized");
        }
        return deliveryRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
    }

    public Delivery create(String farmerId, String orderId, String vehicleId, String driverId, String pickupAddress, String dropoffAddress) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getFarmer().getId().equals(farmerId)) {
            throw new SecurityException("Unauthorized");
        }

        Vehicle vehicle = null;
        if (vehicleId != null && !vehicleId.isBlank()) {
            vehicle = vehicleRepository.findByIdAndTenantUserId(vehicleId, farmerId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        }

        User driver = null;
        if (driverId != null && !driverId.isBlank()) {
            driver = userRepository.findById(driverId).orElseThrow(() -> new RuntimeException("Driver not found"));
        }

        Delivery delivery = Delivery.builder()
            .order(order)
            .vehicle(vehicle)
            .driver(driver)
            .pickupAddress(pickupAddress)
            .dropoffAddress(dropoffAddress)
            .status(Delivery.DeliveryStatus.PENDING)
            .trackingCode("DLV-" + System.currentTimeMillis())
            .build();

        return deliveryRepository.save(delivery);
    }

    public Delivery updateStatus(String deliveryId, Delivery.DeliveryStatus status, String actorId) {
        Delivery delivery = deliveryRepository.findById(deliveryId).orElseThrow(() -> new RuntimeException("Delivery not found"));
        Order order = delivery.getOrder();

        if (!order.getFarmer().getId().equals(actorId)
            && !order.getBuyer().getId().equals(actorId)
            && (delivery.getDriver() == null || !delivery.getDriver().getId().equals(actorId))) {
            throw new SecurityException("Unauthorized");
        }

        delivery.setStatus(status);
        if (status == Delivery.DeliveryStatus.IN_TRANSIT) {
            delivery.setPickedUpAt(LocalDateTime.now());
        }
        if (status == Delivery.DeliveryStatus.DELIVERED) {
            delivery.setDeliveredAt(LocalDateTime.now());
        }
        return deliveryRepository.save(delivery);
    }
}
