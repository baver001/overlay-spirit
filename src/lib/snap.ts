/**
 * Snap (прилипание) оверлея к краям и центру артборда
 */

export interface SnapConfig {
  threshold: number; // Расстояние для срабатывания snap (в пикселях)
  enabled: boolean;
}

export interface SnapResult {
  x: number;
  y: number;
  snappedX: 'left' | 'center' | 'right' | null;
  snappedY: 'top' | 'center' | 'bottom' | null;
}

const DEFAULT_THRESHOLD = 12;

/**
 * Вычисляет позицию с учётом прилипания к краям артборда
 * 
 * @param pos - текущая позиция центра оверлея (относительно центра артборда)
 * @param overlayWidth - ширина оверлея (с учётом scale)
 * @param overlayHeight - высота оверлея (с учётом scale)
 * @param canvasWidth - ширина артборда
 * @param canvasHeight - высота артборда
 * @param threshold - порог прилипания
 */
export function snapToEdges(
  pos: { x: number; y: number },
  overlayWidth: number,
  overlayHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  threshold: number = DEFAULT_THRESHOLD
): SnapResult {
  let { x, y } = pos;
  let snappedX: SnapResult['snappedX'] = null;
  let snappedY: SnapResult['snappedY'] = null;

  // Границы артборда относительно его центра
  const canvasLeft = -canvasWidth / 2;
  const canvasRight = canvasWidth / 2;
  const canvasTop = -canvasHeight / 2;
  const canvasBottom = canvasHeight / 2;

  // Края оверлея относительно его центра
  const overlayLeft = x - overlayWidth / 2;
  const overlayRight = x + overlayWidth / 2;
  const overlayTop = y - overlayHeight / 2;
  const overlayBottom = y + overlayHeight / 2;

  // === Горизонтальное прилипание ===
  
  // Левый край оверлея к левому краю артборда
  if (Math.abs(overlayLeft - canvasLeft) < threshold) {
    x = canvasLeft + overlayWidth / 2;
    snappedX = 'left';
  }
  // Правый край оверлея к правому краю артборда
  else if (Math.abs(overlayRight - canvasRight) < threshold) {
    x = canvasRight - overlayWidth / 2;
    snappedX = 'right';
  }
  // Центр оверлея к центру артборда по X
  else if (Math.abs(x) < threshold) {
    x = 0;
    snappedX = 'center';
  }

  // === Вертикальное прилипание ===
  
  // Верхний край оверлея к верхнему краю артборда
  if (Math.abs(overlayTop - canvasTop) < threshold) {
    y = canvasTop + overlayHeight / 2;
    snappedY = 'top';
  }
  // Нижний край оверлея к нижнему краю артборда
  else if (Math.abs(overlayBottom - canvasBottom) < threshold) {
    y = canvasBottom - overlayHeight / 2;
    snappedY = 'bottom';
  }
  // Центр оверлея к центру артборда по Y
  else if (Math.abs(y) < threshold) {
    y = 0;
    snappedY = 'center';
  }

  return { x, y, snappedX, snappedY };
}

