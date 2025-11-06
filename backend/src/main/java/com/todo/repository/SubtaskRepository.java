package com.todo.repository;

import com.todo.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Integer> {

    // Find all subtasks for a specific todo
    List<Subtask> findByTodoIdOrderByPositionAsc(Integer todoId);

    // Delete all subtasks for a specific todo
    void deleteByTodoId(Integer todoId);

    // Count total subtasks for a todo
    long countByTodoId(Integer todoId);

    // Count completed subtasks for a todo
    long countByTodoIdAndIsCompletedTrue(Integer todoId);
}