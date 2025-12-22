package com.todo.service;

import com.todo.dto.AttachmentDTO;
import com.todo.dto.UserDTO;
import com.todo.entity.Attachment;
import com.todo.entity.Todo;
import com.todo.entity.User;
import com.todo.repository.AttachmentRepository;
import com.todo.repository.TodoRepository;
import com.todo.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class AttachmentService {

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * CREATE attachment
     */
    public AttachmentDTO createAttachment(Integer todoId, MultipartFile file, Integer userId) {
        try {
            Todo todo = todoRepository.findById(todoId)
                    .orElseThrow(() -> new RuntimeException("Todo not found"));

            // Ownership check: user can only attach to their own todos
            if (todo.getUser() == null || !todo.getUser().getId().equals(userId)) {
                throw new RuntimeException("Access denied");
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Store file
            String storedFileName = fileStorageService.uploadFile(file);


            //This is temporary, will be replaced with url being returned from bucket API
            String url = UUID.randomUUID().toString().replace("-", "");

            UserDTO userDTO = new UserDTO(user);


            Attachment attachment = new Attachment(
                    file.getOriginalFilename(),
                    storedFileName,
                    file.getSize(),
                    file.getContentType(),
                    user.getId(),
                    todo,
                    url
            );

            AttachmentDTO attachmentDTO = new AttachmentDTO(attachment, userDTO);

            attachmentRepository.save(attachment);

            return attachmentDTO;

        } catch (IOException ex) {
            log.error("Failed to upload attachment", ex);
            throw new RuntimeException("File upload failed");
        }
    }

    /**
     * READ attachments by todo
     */
    public List<AttachmentDTO> getAttachmentsByTodoId(Integer todoId) {
        List<Attachment> attachments = attachmentRepository.findByTodo_IdOrderByCreatedAtDesc(todoId);

        List<AttachmentDTO> attachmentDTOS = new ArrayList<>();
        attachments.forEach(attachment -> {
            UserDTO userDTO = new UserDTO();
            AttachmentDTO attachmentDTO = new AttachmentDTO(attachment, userDTO);
            attachmentDTOS.add(attachmentDTO);
        });

        return attachmentDTOS;
    }

    /**
     * DELETE attachment (ownership enforced)
     */
    public void deleteAttachment(Integer attachmentId, Integer userId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

        if (!attachment.getUploadedBy().equals(userId)) {
            throw new RuntimeException("You can only delete your own attachments");
        }

        try {
            // Delete file from storage first
            fileStorageService.deleteFile(attachment.getFilePath());

            // Then delete DB record
            attachmentRepository.delete(attachment);

        } catch (IOException ex) {
            log.error("Failed to delete attachment file", ex);
            throw new RuntimeException("Failed to delete attachment");
        }
    }
}
