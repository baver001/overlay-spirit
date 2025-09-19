
import React, { useState, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { Overlay } from "./lib/types";
import { v4 as uuidv4 } from 'uuid';
import EditorCanvas from "./components/EditorCanvas";

// Создаем QueryClient с оптимизированными настройками
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минут
      gcTime: 10 * 60 * 1000, // 10 минут
    },
  },
});

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number} | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [overlayAspectRatios, setOverlayAspectRatios] = useState<Record<string, number>>({});


  const handleImageSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
  }, []);

  const handleAddOverlay = useCallback((type: 'css' | 'image', value: string) => {
    const newOverlay: Overlay = {
      id: uuidv4(),
      type,
      value,
      x: 0,
      y: 0,
      opacity: 0.8,
      scale: 1,
      rotation: 0,
      blendMode: 'screen',
      flipH: false,
      flipV: false,
    };

    if (type === 'image') {
      const img = new Image();
      img.onload = () => {
        setOverlayAspectRatios(prev => ({
          ...prev,
          [newOverlay.id]: img.naturalWidth / img.naturalHeight,
        }));
      };
      img.src = value;
    }

    setOverlays(prev => [...prev, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
  }, []);

  const handleUpdateOverlay = useCallback((id: string, newProps: Partial<Overlay>) => {
    setOverlays(prev =>
      prev.map(overlay =>
        overlay.id === id ? { ...overlay, ...newProps } : overlay
      )
    );
  }, []);

  const handleDeleteOverlay = useCallback((id: string) => {
    setOverlays(prev => prev.filter(overlay => overlay.id !== id));
    setSelectedOverlayId(null);
  }, []);

  const handleImageRemove = useCallback(() => {
    setImage(null);
    setImageDimensions(null);
    setOverlays([]);
    setSelectedOverlayId(null);
    setOverlayAspectRatios({});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/editor" element={
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
                overlayAspectRatios={overlayAspectRatios}
              />
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
