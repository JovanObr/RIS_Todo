package com.todo.dto;
import java.util.Map;

public interface OAuth2UserInfo {
    /**
     * Get the unique ID from the OAuth provider
     */
    String getId();

    /**
     * Get the user's name
     */
    String getName();

    /**
     * Get the user's email address
     */
    String getEmail();

    /**
     * Get the user's profile picture URL
     */
    String getImageUrl();

    /**
     * Get all attributes from the OAuth provider
     */
    Map<String, Object> getAttributes();
}
