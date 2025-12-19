package com.todo.service;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload.dir:uploads}")
    private String uploadDir;

    /**
     * -- GETTER --
     *  Get the file storage location path
     */
    @Getter
    private Path fileStorageLocation;

    // Allowed file types
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif"
    );

    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "text/plain"
    );

    // Maximum file size: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    /**
     * Initialize the file storage directory on service startup
     */
    @PostConstruct
    public void init() {
        try {
            this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.fileStorageLocation);
            System.out.println("File upload directory created/verified at: " + this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create upload directory!", ex);
        }
    }

    /**
     * Upload a file to the storage directory
     */
    public String uploadFile(MultipartFile file) throws IOException {
        // Validate file is not empty
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum limit of 10MB");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (!isValidFileType(contentType)) {
            throw new IllegalArgumentException(
                    "Invalid file type. Allowed types: JPG, PNG, GIF, PDF, DOCX, TXT"
            );
        }

        // Get original filename and clean it
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        // Validate filename
        if (originalFileName.contains("..")) {
            throw new IllegalArgumentException("Invalid file path: " + originalFileName);
        }

        // Generate unique filename to avoid collisions
        String uniqueFileName = generateUniqueFileName(originalFileName);

        try {
            // Copy file to the target location
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            return uniqueFileName;

        } catch (IOException ex) {
            throw new IOException("Could not store file " + uniqueFileName, ex);
        }
    }

    /**
     * Download a file as a Resource
     */
    public Resource downloadFile(String fileName) throws IOException {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new IOException("File not found: " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new IOException("File not found: " + fileName, ex);
        }
    }

    /**
     * Delete a file from storage
     */
    public boolean deleteFile(String fileName) throws IOException {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            return Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new IOException("Could not delete file: " + fileName, ex);
        }
    }

    /**
     * Generate a unique filename using UUID + original filename
     */
    private String generateUniqueFileName(String originalFileName) {
        String uuid = UUID.randomUUID().toString();
        return uuid + "_" + originalFileName;
    }

    /**
     * Validate if the file type is allowed
     */
    private boolean isValidFileType(String contentType) {
        if (contentType == null) {
            return false;
        }
        return ALLOWED_IMAGE_TYPES.contains(contentType) ||
                ALLOWED_DOCUMENT_TYPES.contains(contentType);
    }

    /**
     * Check if a file exists in storage
     */
    public boolean fileExists(String fileName) {
        Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
        return Files.exists(filePath);
    }

    /**
     * Get file size in bytes
     */
    public long getFileSize(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            return Files.size(filePath);
        } catch (IOException ex) {
            return -1;
        }
    }
}
