import React, { useCallback, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import EditorCanvas from '@/components/EditorCanvas';
import { Overlay } from '@/lib/types';
import { OVERLAY_DEFAULTS } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface ImageDimensions {
  width: number;
  height: number;
}

const EditorPage: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedOverlay = useMemo(
    () => overlays.find((overlay) => overlay.id === selectedOverlayId),
    [overlays, selectedOverlayId]
  );

  const processImageFile = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImage(objectUrl);
    };
    img.onerror = () => {
      console.error('Ошибка загрузки изображения');
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  }, []);

  const handleImageSelect = useCallback(
    (file: File) => {
      if (file && file.type.startsWith('image/')) {
        processImageFile(file);
      }
    },
    [processImageFile]
  );

  const handleImageRemove = useCallback(() => {
    if (image) {
      URL.revokeObjectURL(image);
    }
    setImage(null);
    setImageDimensions(null);
    setOverlays([]);
    setSelectedOverlayId(null);
  }, [image]);

  const handleAddOverlay = useCallback((type: 'css' | 'image', value: string) => {
    const newOverlay: Overlay = {
      id: uuidv4(),
      type,
      value,
      blendMode: OVERLAY_DEFAULTS.BLEND_MODE,
      opacity: OVERLAY_DEFAULTS.OPACITY,
      x: OVERLAY_DEFAULTS.POSITION.x,
      y: OVERLAY_DEFAULTS.POSITION.y,
      rotation: OVERLAY_DEFAULTS.ROTATION,
      scale: OVERLAY_DEFAULTS.SCALE,
      flipH: OVERLAY_DEFAULTS.FLIP.horizontal,
      flipV: OVERLAY_DEFAULTS.FLIP.vertical,
    };
    setOverlays((prev) => [...prev, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
  }, []);

  const handleUpdateOverlay = useCallback((id: string, newProps: Partial<Overlay>) => {
    setOverlays((prev) => prev.map((overlay) => (overlay.id === id ? { ...overlay, ...newProps } : overlay)));
  }, []);

  const handleDeleteOverlay = useCallback((id: string) => {
    setOverlays((prev) => prev.filter((overlay) => overlay.id !== id));
    setSelectedOverlayId(null);
  }, []);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col bg-background pt-16 md:flex-row md:pt-16">
      <Sidebar
        onAddOverlay={handleAddOverlay}
        selectedOverlay={selectedOverlay}
        onUpdateOverlay={handleUpdateOverlay}
        onDeleteOverlay={handleDeleteOverlay}
      />
      <div className="flex-1 overflow-hidden">
        <EditorCanvas
          image={image}
          imageDimensions={imageDimensions}
          overlays={overlays}
          onUpdateOverlay={handleUpdateOverlay}
          selectedOverlayId={selectedOverlayId}
          onSelectOverlay={setSelectedOverlayId}
          onDeleteOverlay={handleDeleteOverlay}
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-full max-w-md p-0">
          <SheetHeader className="border-b border-border px-4 py-3 text-left">
            <SheetTitle>Библиотека оверлеев</SheetTitle>
          </SheetHeader>
          <Sidebar
            mobile
            onAddOverlay={handleAddOverlay}
            selectedOverlay={selectedOverlay}
            onUpdateOverlay={handleUpdateOverlay}
            onDeleteOverlay={handleDeleteOverlay}
            className="max-h-[calc(100vh-8rem)]"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default EditorPage;
