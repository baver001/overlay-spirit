
import React, { useState } from 'react';
import { Trash2, Upload, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ImageManagerProps {
  image: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
}

const ImageManager: React.FC<ImageManagerProps> = ({ image, onImageSelect, onImageRemove }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelect(event.target.files[0]);
      setIsDialogOpen(false);
    }
  };

  const handleRemoveImage = () => {
    onImageRemove();
    setIsDialogOpen(false);
  };

  const handleReplaceImage = () => {
    fileInputRef.current?.click();
  };

  if (!image) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-20">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить изображение?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Изображение и все примененные к нему оверлеи будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReplaceImage}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Заменить
              </Button>
              <AlertDialogAction onClick={handleRemoveImage} className="bg-red-500 hover:bg-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImageManager;
