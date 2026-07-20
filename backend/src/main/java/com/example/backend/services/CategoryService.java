package com.example.backend.services;

import java.util.List;
import org.springframework.stereotype.Service;
import com.example.backend.models.Category;
import com.example.backend.repositories.CategoryRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> listActive() {
        return categoryRepository.findAll().stream().filter(Category::isActive).toList();
    }

    public Category create(Category category) {
        category.setId(null);
        category.setActive(true);
        return categoryRepository.save(category);
    }
}
