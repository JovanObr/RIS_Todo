import React, { useState } from "react";
import { uploadAttachment } from "../services/attachmentService";

const AttachmentUpload = ({ todoId, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const attachment = await uploadAttachment(todoId, file, setProgress);
      onUpload(attachment);
      e.target.value = null;
    } catch (err) {
      setError(typeof err === "string" ? err : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="attachment-upload">
      <label className="upload-btn">
        Upload file
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          hidden
        />
      </label>

      {uploading && (
        <div className="upload-progress">
          <div
            className="upload-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="attachment-error">{error}</p>}
    </div>
  );
};

export default AttachmentUpload;
