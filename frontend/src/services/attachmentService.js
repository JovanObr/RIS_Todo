import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/attachments";

const authHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("JWT token not found");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const uploadAttachment = async (todoId, file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_BASE_URL}/todo/${todoId}`,
      formData,
      {
        headers: {
          ...authHeaders(),
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: onProgress
          ? (progressEvent) => {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percent);
            }
          : undefined,
      }
    );

    return response.data; 
  } catch (error) {
    console.error("Upload attachment failed", error);
    throw error.response?.data || error.message;
  }
};

export const getAttachments = async (todoId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/todo/${todoId}`,
      {
        headers: authHeaders(),
      }
    );

    return response.data; 
  } catch (error) {
    console.error("Get attachments failed", error);
    throw error.response?.data || error.message;
  }
};

export const downloadAttachment = async (attachmentId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/${attachmentId}/download`,
      {
        headers: authHeaders(),
        responseType: "blob",
      }
    );

    return response.data; 
  } catch (error) {
    console.error("Download attachment failed", error);
    throw error.response?.data || error.message;
  }
};

export const deleteAttachment = async (attachmentId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/${attachmentId}`,
      {
        headers: authHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    console.error("Delete attachment failed", error);
    throw error.response?.data || error.message;
  }
};
