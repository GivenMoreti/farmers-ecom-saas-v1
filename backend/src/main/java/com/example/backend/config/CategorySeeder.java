package com.example.backend.config;

import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.example.backend.models.Category;
import com.example.backend.repositories.CategoryRepository;
import lombok.RequiredArgsConstructor;

/**
 * The categories table has no other source of data (no Flyway migrations,
 * no admin UI yet) — without this, a fresh database leaves the product
 * listing form's category dropdown permanently empty.
 */
@Component
@RequiredArgsConstructor
public class CategorySeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) return;

        List.of("cattle", "goats", "sheep", "poultry", "pigs", "crops").forEach(name ->
            categoryRepository.save(Category.builder()
                .name(name)
                .active(true)
                .build())
        );
    }
}
