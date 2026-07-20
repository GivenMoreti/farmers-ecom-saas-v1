package com.example.backend.services;

import java.util.List;
import org.springframework.stereotype.Service;
import com.example.backend.models.Favorite;
import com.example.backend.models.Product;
import com.example.backend.models.User;
import com.example.backend.repositories.FavoriteRepository;
import com.example.backend.repositories.ProductRepository;
import com.example.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<Favorite> listForUser(String userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Favorite add(String userId, String productId) {
        if (favoriteRepository.existsByUserIdAndProductId(userId, productId)) {
            return favoriteRepository.findByUserIdAndProductId(userId, productId).orElseThrow();
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Product not found"));

        Favorite favorite = Favorite.builder().user(user).product(product).build();
        return favoriteRepository.save(favorite);
    }

    public void remove(String userId, String productId) {
        favoriteRepository.findByUserIdAndProductId(userId, productId).ifPresent(favoriteRepository::delete);
    }
}
