package com.example.backend.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.models.GoogleAccount;

@Repository
public interface GoogleAccountRepository extends JpaRepository<GoogleAccount, String> {
    Optional<GoogleAccount> findByGoogleId(String googleId);
    Optional<GoogleAccount> findByEmail(String email);
}
