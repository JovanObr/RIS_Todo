package com.todo.repository;

import com.todo.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Integer> {

    /**
     * Find all attachments for a specific todo
     */
    List<Attachment> findByTodo_IdOrderByCreatedAtDesc(Integer todoId);

    /**
     * Delete all attachments for a specific todo
     */
    @Transactional
    void deleteByTodo_Id(Integer todoId);

    /**
     * Count total attachments for a specific todo
     */
    long countByTodo_Id(Integer todoId);

    /**
     * Find all attachments uploaded by a specific user
     */
    List<Attachment> findByUploadedBy(Integer uploadedBy);

    /**
     * Check if an attachment exists by ID and belongs to a specific todo
     */
    boolean existsByIdAndTodo_Id(Integer id, Integer todoId);
}