import axios from 'axios';

// Thông tin Cloudinary của dự án
const CLOUD_NAME = 'dw3wwmm7w'; 
const UPLOAD_PRESET = 'swp391_sum26';  

/**
 * Upload file lên Cloudinary
 * Hỗ trợ mọi loại file (Video, PDF, Image...) bằng cách dùng endpoint /auto/upload
 * 
 * @param {File} file - File cần upload 
 * @param {function} onProgress - Callback trả về % tiến trình upload (từ 0 đến 100)
 * @returns {Promise<string>} Trả về URL của file sau khi upload thành công
 */
export const uploadFileToCloudinary = async (file, onProgress = null) => {
  if (!file) throw new Error("Không có file để upload");

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  // Endpoint auto tự động nhận diện loại file (image, video, raw cho pdf/docx...)
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return {
      url: response.data.secure_url,
      size: response.data.bytes
    };
  } catch (error) {
    console.error("Lỗi upload Cloudinary:", error);
    throw error;
  }
};
