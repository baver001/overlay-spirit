import { useCallback, useRef } from 'react';

interface PinchState {
  initialDistance: number;
  initialScale: number;
  centerX: number;
  centerY: number;
}

// Вычисление расстояния между двумя точками касания
const getDistance = (touch1: Touch, touch2: Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

// Вычисление центра между двумя точками касания
const getCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
};

export const usePinchZoom = (
  onScale: (scale: number) => void,
  getCurrentScale: () => number
) => {
  const pinchRef = useRef<PinchState | null>(null);
  const isPinchingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = getDistance(touch1, touch2);
      const center = getCenter(touch1, touch2);
      
      pinchRef.current = {
        initialDistance: distance,
        initialScale: getCurrentScale(),
        centerX: center.x,
        centerY: center.y,
      };
      isPinchingRef.current = true;
    }
  }, [getCurrentScale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current && isPinchingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const currentDistance = getDistance(touch1, touch2);
      const { initialDistance, initialScale } = pinchRef.current;
      
      // Вычисляем новый масштаб
      const scaleFactor = currentDistance / initialDistance;
      let newScale = initialScale * scaleFactor;
      
      // Ограничиваем масштаб
      newScale = Math.max(0.1, Math.min(5, newScale));
      
      onScale(newScale);
    }
  }, [onScale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Если осталось меньше 2 касаний — завершаем pinch
    if (e.touches.length < 2) {
      pinchRef.current = null;
      isPinchingRef.current = false;
    }
  }, []);

  return {
    handlePinchStart: handleTouchStart,
    handlePinchMove: handleTouchMove,
    handlePinchEnd: handleTouchEnd,
    isPinching: isPinchingRef.current,
  };
};

