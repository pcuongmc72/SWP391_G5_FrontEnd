import axios from 'axios';

// Thông tin Cloudinary của dự án
const CLOUD_NAME = 'dw3wwmm7w'; 
const UPLOAD_PRESET = 'swp391_sum26';  

// Các loại file cần upload dưới dạng raw (không preview được, chỉ download)
const RAW_FILE_TYPES = /\.(zip|rar|7z|gz|tar)$/i;

/**
 * Upload file lên Cloudinary
 * Tự động chọn resource_type:
 *   - 'raw'  → cho ZIP, RAR, 7z... (file nén, chỉ tải về)
 *   - 'auto' → cho Image, Video, PDF, Office... (có thể preview)
 * 
 * @param {File} file - File cần upload 
 * @param {function} onProgress - Callback trả về % tiến trình upload (từ 0 đến 100)
 * @returns {Promise<{url: string, size: number}>} URL và dung lượng file sau khi upload
 */
export const uploadFileToCloudinary = async (file, onProgress = null) => {
  if (!file) throw new Error("Không có file để upload");

  // Xác định resource_type dựa vào phần mở rộng file
  const isRawFile = RAW_FILE_TYPES.test(file.name);
  const resourceType = isRawFile ? 'raw' : 'auto';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  try {
    const response = await axios.post(uploadUrl, formData, {
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
