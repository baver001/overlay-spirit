import React, { useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import EditorCanvas from '@/components/EditorCanvas';
import MobileOverlayPanel from '@/components/MobileOverlayPanel';
import Footer from '@/components/Footer';
import { Overlay } from '@/lib/types';
import { OVERLAY_DEFAULTS } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';

interface ImageDimensions {
  width: number;
  height: number;
}

const Index: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  const selectedOverlay = useMemo(
    () => overlays.find(o => o.id === selectedOverlayId),
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

  const handleImageSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  }, [processImageFile]);

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
    // Преобразуем ключ из БД в полный URL для изображений
    let overlayValue = value;
    if (type === 'image' && value.startsWith('overlays/')) {
      overlayValue = `/api/files/${value}`;
    }
    
    const newOverlay: Overlay = {
      id: uuidv4(),
      type,
      value: overlayValue,
      blendMode: OVERLAY_DEFAULTS.BLEND_MODE,
      opacity: OVERLAY_DEFAULTS.OPACITY,
      x: OVERLAY_DEFAULTS.POSITION.x,
      y: OVERLAY_DEFAULTS.POSITION.y,
      rotation: OVERLAY_DEFAULTS.ROTATION,
      scale: OVERLAY_DEFAULTS.SCALE,
      flipH: OVERLAY_DEFAULTS.FLIP.horizontal,
      flipV: OVERLAY_DEFAULTS.FLIP.vertical,
    };
    setOverlays(prev => [...prev, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
  }, []);
  
  const handleUpdateOverlay = useCallback((id: string, newProps: Partial<Overlay>) => {
    setOverlays(prev => prev.map(o => o.id === id ? { ...o, ...newProps } : o));
  }, []);

  const handleDeleteOverlay = useCallback((id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
    setSelectedOverlayId(null);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <Sidebar 
          onAddOverlay={handleAddOverlay}
          selectedOverlay={selectedOverlay}
          onUpdateOverlay={handleUpdateOverlay}
          onDeleteOverlay={handleDeleteOverlay}
        />
        
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
        />
        
        {/* Mobile Bottom Panel */}
        <MobileOverlayPanel
          onAddOverlay={handleAddOverlay}
          selectedOverlay={selectedOverlay}
          onUpdateOverlay={handleUpdateOverlay}
          onDeleteOverlay={handleDeleteOverlay}
        />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
