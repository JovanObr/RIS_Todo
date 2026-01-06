package com.todo.repository;

import com.todo.entity.GoogleCalendarToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface GoogleCalendarTokenRepository extends JpaRepository<GoogleCalendarToken, Integer> {

    Optional<GoogleCalendarToken> findByUserId(Integer userId);

    boolean existsByUserId(Integer userId);

    void deleteByUserId(Integer userId);
}