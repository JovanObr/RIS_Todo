package com.todo.repository;

import com.todo.entity.User;
import com.todo.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findByIsActiveTrue();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'USER'")
    long countRegularUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'ADMIN'")
    long countAdmins();

    Optional<User> findByProviderAndProviderId(String provider, String providerId);

    Boolean existsByProviderAndProviderId(String provider, String providerId);
}