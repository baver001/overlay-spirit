
export interface Overlay {
  id: string;
  type: 'css' | 'image';
  value: string; // CSS for gradient or URL for image
  blendMode: 'normal' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn' | 'difference' | 'exclusion';
  opacity: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  flipH: boolean;
  flipV: boolean;
}
