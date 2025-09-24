export interface Overlay {
  id: string;
  type: 'css' | 'image';
  value: string; // CSS for gradient or URL for image
  blendMode:
    | 'normal'
    | 'screen'
    | 'multiply'
    | 'overlay'
    | 'soft-light'
    | 'hard-light'
    | 'color-dodge'
    | 'color-burn'
    | 'difference'
    | 'exclusion';
  opacity: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  flipH: boolean;
  flipV: boolean;
}

export type UserRole = 'customer' | 'admin';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: number;
  provider?: 'local' | 'google' | 'apple';
}

export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface OverlaySetSummary {
  id: string;
  title: string;
  description?: string;
  categoryId?: string;
  coverImageUrl?: string;
  isPaid: boolean;
  priceCents?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface OverlayAsset {
  id: string;
  setId: string;
  kind: 'css' | 'image';
  value: string;
  aspectRatio?: number;
  orderIndex: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface OverlaySetWithAssets extends OverlaySetSummary {
  overlays: OverlayAsset[];
}

export interface CatalogCategoryWithSets extends CatalogCategory {
  sets: OverlaySetWithAssets[];
}

export interface OverlayCatalogSnapshot {
  categories: CatalogCategoryWithSets[];
  uncategorized: OverlaySetWithAssets[];
}

export interface PurchaseRecord {
  id: string;
  userId: string;
  setId: string;
  priceCents: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'refunded' | 'failed';
  provider?: string;
  providerTxnId?: string;
  createdAt: number;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface UsageStat {
  id: string;
  userId?: string;
  clientId?: string;
  setId?: string;
  overlayId?: string;
  action: string;
  meta?: Record<string, unknown>;
  createdAt: number;
}

export interface SharedRender {
  id: string;
  imageData: string;
  createdAt: number;
  userId?: string;
  title?: string;
}
