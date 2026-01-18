package com.todo.security;

import com.todo.entity.User;
import com.todo.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        if (response.isCommitted()) {
            return;
        }

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        // Try to get email, fallback to other identifiers
        String email = oAuth2User.getAttribute("email");
        String login = oAuth2User.getAttribute("login"); // GitHub username
        Object idObj = oAuth2User.getAttribute("id"); // GitHub/Facebook ID
        
        // Find user by email or by provider ID
        User user = null;
        if (email != null) {
            user = userRepository.findByEmail(email).orElse(null);
        }
        
        // If not found by email, try GitHub login
        if (user == null && login != null) {
            user = userRepository.findByEmail(login + "@github.local").orElse(null);
        }
        
        // If still not found, try by provider ID
        if (user == null && idObj != null) {
            String providerId = String.valueOf(idObj);
            user = userRepository.findByProviderAndProviderId("GITHUB", providerId)
                    .or(() -> userRepository.findByProviderAndProviderId("GOOGLE", providerId))
                    .or(() -> userRepository.findByProviderAndProviderId("FACEBOOK", providerId))
                    .orElse(null);
        }
        
        if (user == null) {
            // Redirect with error if user not found
            String errorUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/oauth2/redirect")
                    .queryParam("error", "User not found")
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
            return;
        }

        // Generate token using username (which is always set)
        String token = jwtUtil.generateToken(user.getUsername());

        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/oauth2/redirect")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}