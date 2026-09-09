import { apiUpload } from "./client";

export const uploadsApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<{ url: string }>("/uploads", formData);
  },
};
