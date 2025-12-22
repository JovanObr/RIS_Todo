import React from "react";
import { deleteAttachment } from "../services/attachmentService";

const AttachmentList = ({ attachments, onDelete, onDownload }) => {
  if (!attachments.length) {
    return <p className="no-attachments">No attachments yet</p>;
  }

  const handleDownload = async (attachment) => {
    const blob = await onDownload(attachment.id);
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = attachment.fileName;
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this attachment?")) return;

    await deleteAttachment(id);
    onDelete(id);
  };

  return (
    <ul className="attachment-list">
      {attachments.map(att => (
        <li key={att.id} className="attachment-item">
          <span
            className="attachment-name"
            onClick={() => handleDownload(att)}
            title="Download"
          >
            📎 {att.fileName}
          </span>

          <div className="attachment-actions">
            <span className="attachment-size">
              {(att.fileSize / 1024).toFixed(1)} KB
            </span>
            <button
              className="btn-attachment-delete"
              onClick={() => handleDelete(att.id)}
            >
              ✕
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default AttachmentList;
