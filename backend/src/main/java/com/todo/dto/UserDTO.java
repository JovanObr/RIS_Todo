package com.todo.dto;

import com.todo.entity.Role;
import com.todo.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Integer id;
    private String username;
    private String email;
    private String role;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private Integer todoCount;
    private String profilePictureUrl;

    public UserDTO(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        if (user.getRole() == Role.USER) {
            this.role = "USER";
        }else {
            this.role = "ADMIN";
        }

        this.createdAt = user.getCreatedAt();
        this.todoCount = user.getTodos().size();
        this.profilePictureUrl = user.getProfilePictureUrl();
    }
}