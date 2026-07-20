package com.example.backend.services;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import com.example.backend.models.Order;
import com.example.backend.models.Product;
import com.example.backend.models.User;
import com.example.backend.repositories.OrderRepository;
import com.example.backend.repositories.ProductRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<Order> listBuyerOrders(String buyerId) {
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
    }

    public List<Order> listFarmerOrders(String farmerId) {
        return orderRepository.findByFarmerIdOrderByCreatedAtDesc(farmerId);
    }

    public Order createOrder(String buyerId, String productId, String deliveryAddress, boolean farmerDeliverySelected, BigDecimal farmerDeliveryFee, String deliveryInstructions) {
        User buyer = userRepository.findById(buyerId).orElseThrow(() -> new RuntimeException("Buyer not found"));
        Product product = productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Product not found"));

        User farmer = product.getTenant().getUser();

        BigDecimal productPrice = product.getPrice() == null ? BigDecimal.ZERO : product.getPrice();
        BigDecimal buyerServiceFee = productPrice.multiply(new BigDecimal("0.02"));
        BigDecimal farmerCommission = productPrice.multiply(new BigDecimal("0.03"));
        BigDecimal deliveryFee = farmerDeliverySelected && farmerDeliveryFee != null ? farmerDeliveryFee : BigDecimal.ZERO;
        BigDecimal totalAmount = productPrice.add(buyerServiceFee).add(farmerCommission).add(deliveryFee);

        Order order = Order.builder()
            .buyer(buyer)
            .farmer(farmer)
            .product(product)
            .productPrice(productPrice)
            .buyerServiceFee(buyerServiceFee)
            .farmerCommission(farmerCommission)
            .totalAmount(totalAmount)
            .status(Order.OrderStatus.PENDING_PAYMENT)
            .deliveryAddress(deliveryAddress)
            .deliveryInstructions(deliveryInstructions)
            .farmerDeliverySelected(farmerDeliverySelected)
            .farmerDeliveryFee(deliveryFee)
            .build();

        return orderRepository.save(order);
    }

    public Order updateStatus(String orderId, Order.OrderStatus status, String actorId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
        if (!order.getBuyer().getId().equals(actorId) && !order.getFarmer().getId().equals(actorId)) {
            throw new SecurityException("Unauthorized");
        }
        order.setStatus(status);
        return orderRepository.save(order);
    }
}
