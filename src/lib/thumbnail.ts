/**
 * Генерация миниатюры изображения на клиенте
 */

interface ThumbnailOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Создаёт миниатюру из File объекта
 * @returns Blob миниатюры в формате JPEG
 */
export async function createThumbnail(
  file: File,
  options: ThumbnailOptions = {}
): Promise<Blob> {
  const { maxWidth = 300, maxHeight = 200, quality = 0.75 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const ratio = Math.min(widthRatio, heightRatio);
          
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Создаём canvas и рисуем уменьшенное изображение
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Включаем сглаживание для лучшего качества
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);

        // Конвертируем в JPEG blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail'));
    };

    // Загружаем изображение из File
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Создаёт File объект из Blob для загрузки
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

