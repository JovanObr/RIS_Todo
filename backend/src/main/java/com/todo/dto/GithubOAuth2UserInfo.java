package com.todo.dto;

import java.util.Map;

/**
 * Extract user information from GitHub OAuth2 response
 */
public class GithubOAuth2UserInfo implements OAuth2UserInfo {

    private Map<String, Object> attributes;

    public GithubOAuth2UserInfo(Map<String, Object> attributes) {
        this.attributes = attributes;
    }

    @Override
    public String getId() {
        // GitHub returns ID as Integer, convert to String
        Object id = attributes.get("id");
        return id != null ? String.valueOf(id) : null;
    }

    @Override
    public String getName() {
        // Try "name" first, fallback to "login" (username)
        String name = (String) attributes.get("name");
        if (name == null || name.isEmpty()) {
            name = (String) attributes.get("login");
        }
        return name;
    }

    @Override
    public String getEmail() {
        return (String) attributes.get("email");
    }

    @Override
    public String getImageUrl() {
        return (String) attributes.get("avatar_url");
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }
}