import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/constants';
import { useTranslation } from 'react-i18next';

interface ImageDropzoneProps {
  onImageSelect: (file: File) => void;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = React.memo(({ onImageSelect }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!APP_CONFIG.ACCEPTED_IMAGE_TYPES.includes(file.type as any)) {
      return t('editor.image_dropzone.error_type');
    }
    if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
      return t('editor.image_dropzone.error_size');
    }
    return null;
  }, [t]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    setError(null);
    
    if (files && files[0]) {
      const file = files[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        return;
      }
      
      onImageSelect(file);
    }
  }, [onImageSelect, validateFile]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={cn(
        'w-full h-full flex items-center justify-center bg-white rounded-2xl border-2 border-dashed border-gray-300 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/50',
        isDragging && 'bg-blue-100 border-blue-500 scale-[1.02]'
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        className="hidden"
      />
      <div className="text-center text-gray-600 p-12">
        <div className="mb-6">
          {error ? (
            <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
          ) : isDragging ? (
            <ImageIcon className="w-16 h-16 mx-auto text-blue-500" />
          ) : (
            <UploadCloud className="w-16 h-16 mx-auto text-gray-400" />
          )}
        </div>
        {error ? (
          <>
            <p className="font-semibold text-xl mb-2 text-red-600">
              {t('editor.image_dropzone.error_upload')}
            </p>
            <p className="text-sm text-red-500 mb-4">
              {error}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
              }}
              className="text-xs text-blue-500 hover:text-blue-700 underline"
            >
              {t('editor.image_dropzone.try_again')}
            </button>
          </>
        ) : (
          <>
            <p className="font-semibold text-xl mb-2">
              {isDragging ? t('editor.image_dropzone.drop_here') : t('editor.image_dropzone.upload_image')}
            </p>
            <p className="text-sm text-gray-500">
              {t('editor.image_dropzone.click_to_select')}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {t('editor.image_dropzone.formats')}
            </p>
          </>
        )}
      </div>
    </div>
  );
});

ImageDropzone.displayName = 'ImageDropzone';

export default ImageDropzone;
