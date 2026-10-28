export interface ProcessedImage {
  dataUri: string;
  sizeBytes: number;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
}

/**
 * Validates format and size, then draws the image to an offscreen canvas
 * to definitively strip all EXIF tags, GPS metadata, and device signatures.
 */
export async function validateAndStripImageExif(file: File): Promise<ProcessedImage> {
  // 1. Format validation
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload a JPEG, PNG, or WebP photo.');
  }

  // 2. Size validation (5 MB max)
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Image size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5 MB limit.`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or unreadable image file.'));
      img.onload = () => {
        try {
          // Constrain maximum dimensions to 1600px for efficient Gemini payload
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;
          const maxDim = 1600;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context could not be created for EXIF stripping.'));
            return;
          }

          // Rasterize pixels (strips all EXIF headers automatically)
          ctx.drawImage(img, 0, 0, width, height);

          // Export as clean JPEG without metadata
          const dataUri = canvas.toDataURL('image/jpeg', 0.92);

          // Estimate byte size from base64
          const base64Str = dataUri.split(',')[1] || '';
          const sizeBytes = Math.round((base64Str.length * 3) / 4);

          resolve({
            dataUri,
            sizeBytes,
            width,
            height,
            mimeType: 'image/jpeg',
          });
        } catch (err: any) {
          reject(new Error(`Failed to process image: ${err.message || 'Unknown canvas error'}`));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
