import { useState, useCallback, useRef, useEffect } from 'react';

// Оптимизированный throttle с использованием requestAnimationFrame
const throttle = <T extends (...params: unknown[]) => void>(func: T, delay: number = 16) => {
  let timeoutId: number | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = performance.now();

    const invoke = () => {
      func(...args);
      lastExecTime = performance.now();
    };

    if (currentTime - lastExecTime > delay) {
      invoke();
    } else {
      if (timeoutId) cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(invoke);
    }
  };
};

export const useDraggable = (onDrag: (id: string, pos: { x: number; y: number }) => void) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const dragDataRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Throttled версия onDrag для лучшей производительности
  const throttledOnDrag = useCallback(
    throttle(onDrag, 16), // ~60fps
    [onDrag]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, id: string, currentX: number, currentY: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    setActiveId(id);
    
    // Сохраняем начальные координаты
    dragDataRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeId) return;
    
    e.preventDefault();
    
    const { startX, startY, initialX, initialY } = dragDataRef.current;
    
    // Вычисляем смещение
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    // Новая позиция
    const newX = initialX + deltaX;
    const newY = initialY + deltaY;
    
    throttledOnDrag(activeId, { x: newX, y: newY });
  }, [activeId, throttledOnDrag]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeId) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveId(null);
  }, [activeId]);

  // Глобальные обработчики событий
  useEffect(() => {
    if (!activeId) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const { startX, startY, initialX, initialY } = dragDataRef.current;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      throttledOnDrag(activeId, { x: newX, y: newY });
    };

    const handleGlobalMouseUp = () => {
      setActiveId(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveId(null);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeId, throttledOnDrag]);

  const startDrag = useCallback((e: React.MouseEvent<HTMLDivElement>, id: string, currentX: number, currentY: number) => {
    handleMouseDown(e, id, currentX, currentY);
  }, [handleMouseDown]);

  return { 
    handleMouseDown: startDrag, 
    handleMouseMove, 
    handleMouseUp,
    isDragging: !!activeId 
  };
};
