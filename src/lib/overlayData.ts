
export interface OverlaySummary {
  id: string;
  setId: string;
  kind: 'css' | 'image';
  value: string;
  orderIndex: number;
  isActive: boolean;
  aspectRatio?: number | null;
}

export interface OverlaySetSummary {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPaid: boolean;
  isPurchased?: boolean;
  priceCents?: number | null;
  updatedAt: number;
  createdAt: number;
  previewOverlays: OverlaySummary[];
}

export interface OverlayCategorySummary {
  id: string;
  slug: string;
  name: string;
  orderIndex: number;
  setsCount?: number;
}

export interface OverlaysCatalogResponse {
  categories: OverlayCategorySummary[];
  setsByCategory: Record<string, OverlaySetSummary[]>;
}

export const FREE_ITEMS_PREVIEW_LIMIT = 3;

// Моковые данные для разработки дизайна (когда API недоступен)
export const MOCK_CATALOG: OverlaysCatalogResponse = {
  categories: [
    { id: 'cat-bokeh', slug: 'bokeh', name: 'Bokeh', orderIndex: 0, setsCount: 4 },
    { id: 'cat-film-leaks', slug: 'film-leaks', name: 'Film Leaks', orderIndex: 1, setsCount: 3 },
    { id: 'cat-golden-light', slug: 'golden-light', name: 'Golden Light', orderIndex: 2, setsCount: 2 },
    { id: 'cat-prism', slug: 'prism', name: 'Prism', orderIndex: 3, setsCount: 2 },
    { id: 'cat-light-rays', slug: 'light-rays', name: 'Light Rays', orderIndex: 4, setsCount: 3 },
    { id: 'cat-neon', slug: 'neon', name: 'Neon', orderIndex: 5, setsCount: 2 },
  ],
  setsByCategory: {
    'cat-bokeh': [
      { id: 'set-1', title: 'Soft Bokeh', isPaid: false, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'set-2', title: 'Golden Bokeh', isPaid: true, priceCents: 499, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'set-3', title: 'Rainbow Bokeh', isPaid: true, priceCents: 699, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'set-4', title: 'Sparkling Bokeh', isPaid: true, priceCents: 599, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
    ],
    'cat-film-leaks': [
      { id: 'set-5', title: 'Vintage Film', isPaid: false, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'set-6', title: 'Retro Leaks', isPaid: true, priceCents: 399, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'set-7', title: 'Cinematic', isPaid: true, priceCents: 799, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
    ],
    'cat-golden-light': [
      { id: 'set-8', title: 'Sunset Glow', isPaid: false, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'set-9', title: 'Magic Hour', isPaid: true, priceCents: 599, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
    ],
    'cat-prism': [
      { id: 'set-10', title: 'Crystal Prism', isPaid: false, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'set-11', title: 'Rainbow Split', isPaid: true, priceCents: 499, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
    ],
    'cat-light-rays': [
      { id: 'set-12', title: 'Sun Rays', isPaid: false, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'set-13', title: 'Divine Light', isPaid: true, priceCents: 699, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'set-14', title: 'Ethereal Beams', isPaid: true, priceCents: 599, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
    ],
    'cat-neon': [
      { id: 'set-15', title: 'Neon Glow', isPaid: false, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
      { id: 'set-16', title: 'Cyberpunk', isPaid: true, priceCents: 899, previewOverlays: [], updatedAt: Date.now(), createdAt: Date.now() },
    ],
  },
};
