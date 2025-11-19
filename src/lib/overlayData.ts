
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
