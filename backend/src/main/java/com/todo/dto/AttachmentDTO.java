package com.todo.dto;

import com.todo.entity.Attachment;
import com.todo.repository.UserRepository;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;

@Getter
@Setter
public class AttachmentDTO {


    private String fileName;
    private Long fileSize;
    private String fileType;
    private UserDTO uploadedBy;
    private String downloadURL;
    private LocalDateTime createdAt;

    public AttachmentDTO(Attachment attachment, UserDTO user) {
        this.setFileName(attachment.getFileName());
        this.setFileSize(attachment.getFileSize());
        this.setFileType(attachment.getFileType());
        this.setCreatedAt(attachment.getCreatedAt());
        this.setUploadedBy(user);
        this.setDownloadURL(attachment.getDownloadURL());
    }


}
