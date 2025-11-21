package com.todo.service;

import com.todo.dto.UserDTO;
import com.todo.entity.User;
import com.todo.repository.UserRepository;
import com.todo.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TodoRepository todoRepository;

    // Get all users (Admin only)
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get user by ID
    public Optional<UserDTO> getUserById(Integer id) {
        return userRepository.findById(id).map(this::convertToDTO);
    }

    // Get user by username
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // Delete user (Admin only)
    @Transactional
    public boolean deleteUser(Integer id) {
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // Get user statistics
    public long getTotalUsers() {
        return userRepository.count();
    }

    public long getRegularUsersCount() {
        return userRepository.countRegularUsers();
    }

    public long getAdminUsersCount() {
        return userRepository.countAdmins();
    }

    // Convert User to UserDTO
    private UserDTO convertToDTO(User user) {
        int todoCount = todoRepository.findAll().stream()
                .filter(todo -> todo.getUser() != null && todo.getUser().getId().equals(user.getId()))
                .toList()
                .size();

        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getIsActive(),
                user.getCreatedAt(),
                todoCount
        );
    }
}