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

// Градиенты для категорий каталога
export const CATEGORY_GRADIENTS: Record<string, { start: string; end: string }> = {
  'bokeh': { start: '#FFF0E0', end: '#FFE4CC' },
  'film-leaks': { start: '#FFCBA4', end: '#FFB68A' },
  'golden-light': { start: '#FFE066', end: '#FFD633' },
  'prism': { start: '#E8D4F8', end: '#D4B8F0' },
  'light-rays': { start: '#7EE8FA', end: '#5ED8EC' },
  'holographic': { start: '#E0D4F7', end: '#CFC0F2' },
  'neon': { start: '#FF5C93', end: '#FF3377' },
  'smoke': { start: '#9EADB6', end: '#8599A4' },
  'weather': { start: '#A8D4F0', end: '#8EC5E8' },
  'shadows': { start: '#9C8578', end: '#8A7265' },
  'paper': { start: '#F5EDE6', end: '#E8DDD3' },
  'plastic': { start: '#C5F0F5', end: '#A8E6EF' },
  'grunge': { start: '#B8A398', end: '#A69183' },
  'space': { start: '#5C6BC0', end: '#4A5AB8' },
  'nature': { start: '#26A69A', end: '#1D9688' },
  'glass': { start: '#C8E6F5', end: '#B0DAEE' },
  'glitch': { start: '#F088F8', end: '#E55CEF' },
  'frames': { start: '#D4DAE0', end: '#C4CCD4' },
  'ethereal': { start: '#EDE7F6', end: '#D9CEF0' },
  'hearts': { start: '#FFCDD9', end: '#FFB3C4' },
  'events': { start: '#FFDE80', end: '#FFD24D' },
};