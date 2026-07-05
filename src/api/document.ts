import api from "./axios";

export const uploadDocument = async (
  file: File,
  type: string
) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("type", type);

  const response = await api.post("/documents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.data;
};

export const getMyDocuments = async () => {
  const response = await api.get("/documents/mine");
  return response.data.data;
};

export const deleteDocument = async (id: string) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data.data;
};