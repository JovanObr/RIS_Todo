package com.todo.service;

import com.todo.entity.User;
import com.todo.entity.Role;
import com.todo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Map;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        try {
            return processOAuth2User(oAuth2UserRequest, oAuth2User);
        } catch (Exception ex) {
            throw new InternalAuthenticationServiceException(ex.getMessage(), ex.getCause());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
        String registrationId = oAuth2UserRequest.getClientRegistration().getRegistrationId();
        String provider = registrationId.toUpperCase(); // Convert to match your "GOOGLE", "GITHUB" format
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String providerId = extractProviderId(registrationId, attributes);
        String email = (String) attributes.get("email");
        String imageUrl = extractImageUrl(registrationId, attributes);

        if (!StringUtils.hasLength(email)) {
            throw new OAuth2AuthenticationException("Email not found from " + provider);
        }

        Optional<User> userOptional = userRepository.findByProviderAndProviderId(provider, providerId);

        User user;
        if (userOptional.isPresent()) {
            user = updateExistingUser(userOptional.get(), imageUrl);
        } else {
            Optional<User> userByEmail = userRepository.findByEmail(email);
            if (userByEmail.isPresent()) {
                user = updateExistingUser(userByEmail.get(), provider, providerId, imageUrl);
            } else {
                user = registerNewUser(provider, providerId, email, imageUrl);
            }
        }

        return oAuth2User;
    }

    private User registerNewUser(String provider, String providerId, String email, String imageUrl) {
        User user = new User();
        user.setProvider(provider);
        user.setProviderId(providerId);
        user.setEmail(email);
        user.setUsername(email);
        user.setProfilePictureUrl(imageUrl);
        user.setPassword("OAUTH2_USER");
        user.setRole(Role.USER);
        user.setIsActive(true);
        return userRepository.save(user);
    }

    private User updateExistingUser(User user, String imageUrl) {
        user.setProfilePictureUrl(imageUrl);
        return userRepository.save(user);
    }

    private User updateExistingUser(User user, String provider, String providerId, String imageUrl) {
        user.setProvider(provider);
        user.setProviderId(providerId);
        user.setProfilePictureUrl(imageUrl);
        return userRepository.save(user);
    }

    private String extractProviderId(String regId, Map<String, Object> attributes) {
        if ("google".equals(regId)) return (String) attributes.get("sub");
        if ("facebook".equals(regId) || "github".equals(regId)) return String.valueOf(attributes.get("id"));
        return null;
    }

    private String extractImageUrl(String regId, Map<String, Object> attributes) {
        if ("google".equals(regId)) return (String) attributes.get("picture");
        if ("github".equals(regId)) return (String) attributes.get("avatar_url");
        if ("facebook".equals(regId)) {
            Map<String, Object> picture = (Map<String, Object>) attributes.get("picture");
            Map<String, Object> data = (Map<String, Object>) picture.get("data");
            return (String) data.get("url");
        }
        return null;
    }
}