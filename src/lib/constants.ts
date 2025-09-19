// Константы приложения
export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  SIDEBAR_WIDTH: 340,
  HEADER_HEIGHT: 64,
  CANVAS_PADDING: 0.8, // 80% от доступного пространства
} as const;

export const OVERLAY_DEFAULTS = {
  BLEND_MODE: 'screen' as const,
  OPACITY: 0.8,
  POSITION: { x: 0, y: 0 },
  ROTATION: 0,
  SCALE: 1,
  FLIP: { horizontal: false, vertical: false },
} as const;

export const PERFORMANCE = {
  THROTTLE_DELAY: 16, // ~60fps
  DEBOUNCE_DELAY: 300,
} as const;

export const BLEND_MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'screen', label: 'Screen' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'hue', label: 'Hue' },
  { value: 'saturation', label: 'Saturation' },
  { value: 'color', label: 'Color' },
  { value: 'luminosity', label: 'Luminosity' }
] as const;

// Соответствие режимов наложения между UI (CSS mix-blend-mode)
// и CanvasRenderingContext2D.globalCompositeOperation
// Почти все совпадают 1:1, кроме normal → source-over
export const CANVAS_BLEND_MAP: Record<string, GlobalCompositeOperation> = {
  normal: 'source-over',
  screen: 'screen',
  multiply: 'multiply',
  overlay: 'overlay',
  'soft-light': 'soft-light',
  'hard-light': 'hard-light',
  'color-dodge': 'color-dodge',
  'color-burn': 'color-burn',
  difference: 'difference',
  exclusion: 'exclusion',
  darken: 'darken',
  lighten: 'lighten',
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity',
};