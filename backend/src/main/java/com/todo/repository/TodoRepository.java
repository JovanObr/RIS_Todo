package com.todo.repository;

import com.todo.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Integer> {
    List<Todo> findTodosByTitleContainingIgnoreCaseAndUserIdIs(String title, Integer user_id);
    List<Todo> findTodosByUserIdIs(Integer user_id);
}