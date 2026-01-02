/**
 * Image utility functions for handling file uploads and resizing
 */

export const IMAGE_SIZE = 256;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Resize an image file to a specific size
 * @param file - The image file to resize
 * @param size - The target size (default: 256x256)
 * @returns Promise with base64 encoded image string
 */
export const resizeImage = (file: File, size: number = IMAGE_SIZE): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`Image must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const resizedBase64 = canvas.toDataURL("image/jpeg", 0.9);
        resolve(resizedBase64);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};
