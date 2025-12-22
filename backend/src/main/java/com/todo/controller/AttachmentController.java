package com.todo.controller;

import com.todo.dto.AttachmentDTO;
import com.todo.entity.Attachment;
import com.todo.entity.User;
import com.todo.service.AttachmentService;
import com.todo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/attachments")
public class AttachmentController {

    @Autowired
    private AttachmentService attachmentService;

    @Autowired
    private UserService userService;

    /**
     * Upload attachment to a todo
     */
    @PostMapping("/todo/{todoId}")
    public ResponseEntity<?> uploadAttachment(
            @PathVariable Integer todoId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AttachmentDTO attachment =
                attachmentService.createAttachment(todoId, file, user.getId());

        return new ResponseEntity<>(attachment, HttpStatus.CREATED);
    }

    /**
     * Get all attachments for a todo
     */
    @GetMapping("/todo/{todoId}")
    public ResponseEntity<List<AttachmentDTO>> getAttachments(@PathVariable Integer todoId) {
        return ResponseEntity.ok(
                attachmentService.getAttachmentsByTodoId(todoId)
        );
    }

    /**
     * Delete attachment
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttachment(
            @PathVariable Integer id,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = authentication.getName();
        User user = userService.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        attachmentService.deleteAttachment(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
