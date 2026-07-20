package com.example.backend.config;

import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import com.example.backend.models.GoogleAccount;
import com.example.backend.models.User;
import com.example.backend.models.Wallet;
import com.example.backend.repositories.GoogleAccountRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.WalletRepository;
import jakarta.transaction.Transactional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;
    private final GoogleAccountRepository googleAccountRepository;
    private final WalletRepository walletRepository;

    @Override
    @Transactional 
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");
        String googleId = (String) attributes.get("sub");

        // Check if user exists
        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
        } else {
            // Create new user
            user = User.builder()
                .email(email)
                .displayName(name)
                .role(User.UserRole.BUYER) // Default role
                .active(true)
                .build();
            user = userRepository.save(user);

            // Create wallet for the user
            Wallet wallet = Wallet.builder()
                .user(user)
                .build();
            walletRepository.save(wallet);

            // Create Google account link
            GoogleAccount googleAccount = GoogleAccount.builder()
                .user(user)
                .googleId(googleId)
                .email(email)
                .name(name)
                .pictureUrl(picture)
                .build();
            googleAccountRepository.save(googleAccount);
        }

        return oAuth2User;
    }
}
