package com.todo.service;

import com.todo.entity.Subtask;
import com.todo.repository.SubtaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class SubtaskService {

    @Autowired
    private SubtaskRepository subtaskRepository;

    // CREATE - Add a new subtask to a todo
    public Subtask createSubtask(Subtask subtask) {
        return subtaskRepository.save(subtask);
    }

    // READ - Get all subtasks for a specific todo
    public List<Subtask> getSubtasksByTodoId(Integer todoId) {
        return subtaskRepository.findByTodoIdOrderByPositionAsc(todoId);
    }

    // READ - Get a single subtask by id
    public Optional<Subtask> getSubtaskById(Integer id) {
        return subtaskRepository.findById(id);
    }

    // UPDATE - Update subtask (usually just toggle completion)
    public Subtask updateSubtask(Integer id, Subtask subtaskDetails) {
        Optional<Subtask> optionalSubtask = subtaskRepository.findById(id);

        if (optionalSubtask.isPresent()) {
            Subtask subtask = optionalSubtask.get();

            if (subtaskDetails.getTitle() != null) {
                subtask.setTitle(subtaskDetails.getTitle());
            }
            if (subtaskDetails.getIsCompleted() != null) {
                subtask.setIsCompleted(subtaskDetails.getIsCompleted());
            }
            if (subtaskDetails.getPosition() != null) {
                subtask.setPosition(subtaskDetails.getPosition());
            }

            return subtaskRepository.save(subtask);
        }

        return null;
    }

    // DELETE - Delete a subtask
    public boolean deleteSubtask(Integer id) {
        if (subtaskRepository.existsById(id)) {
            subtaskRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // DELETE - Delete all subtasks for a todo
    @Transactional
    public void deleteSubtasksByTodoId(Integer todoId) {
        subtaskRepository.deleteByTodoId(todoId);
    }

    // UTILITY - Get completion stats
    public SubtaskStats getSubtaskStats(Integer todoId) {
        long total = subtaskRepository.countByTodoId(todoId);
        long completed = subtaskRepository.countByTodoIdAndIsCompletedTrue(todoId);
        return new SubtaskStats(total, completed);
    }

    // Inner class for stats
    public static class SubtaskStats {
        private long total;
        private long completed;

        public SubtaskStats(long total, long completed) {
            this.total = total;
            this.completed = completed;
        }

        public long getTotal() {
            return total;
        }

        public long getCompleted() {
            return completed;
        }

        public double getPercentage() {
            return total == 0 ? 0 : (completed * 100.0) / total;
        }
    }
}