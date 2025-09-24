import {
  CatalogCategory,
  CatalogCategoryWithSets,
  OverlayAsset,
  OverlayCatalogSnapshot,
  OverlaySetSummary,
  OverlaySetWithAssets,
  PaymentMethod,
  PurchaseRecord,
  SharedRender,
  UsageStat,
} from '@/lib/types';

type MockDatabase = {
  categories: CatalogCategory[];
  sets: OverlaySetSummary[];
  overlays: OverlayAsset[];
  purchases: PurchaseRecord[];
  usage: UsageStat[];
  paymentMethods: Array<PaymentMethod & { userId: string }>;
  shares: SharedRender[];
};

type CategoryInput = Pick<CatalogCategory, 'name' | 'slug' | 'orderIndex'>;
type SetInput = Pick<OverlaySetSummary, 'title' | 'description' | 'categoryId' | 'coverImageUrl' | 'isPaid' | 'priceCents' | 'isActive'>;
type OverlayInput = Pick<OverlayAsset, 'setId' | 'kind' | 'value' | 'aspectRatio' | 'orderIndex' | 'isActive'>;

type SummaryStats = {
  totalCategories: number;
  totalSets: number;
  totalOverlays: number;
  totalRevenueCents: number;
  activeCustomers: number;
};

const STORAGE_KEY = 'loverlay.db.v1';
let dbCache: MockDatabase | null = null;

function now() {
  return Date.now();
}

function generateId() {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2, 10)}`;
}

function deepClone<T>(value: T): T {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function createDefaultDatabase(): MockDatabase {
  const createdAt = now() - 1000 * 60 * 60 * 24 * 7;
  const categories: CatalogCategory[] = [
    {
      id: generateId(),
      slug: 'warm-tones',
      name: 'Тёплые оттенки',
      orderIndex: 1,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: generateId(),
      slug: 'neon',
      name: 'Неон и свечение',
      orderIndex: 2,
      createdAt,
      updatedAt: createdAt,
    },
  ];

  const sets: OverlaySetSummary[] = [
    {
      id: generateId(),
      title: 'Sunset Stories',
      description: 'Мягкие градиенты и лучи заката для уютных кадров.',
      categoryId: categories[0].id,
      coverImageUrl: 'https://images.unsplash.com/photo-1526481280695-3c46917fc7cd?auto=format&fit=crop&w=600&q=80',
      isPaid: true,
      priceCents: 1299,
      isActive: true,
      createdBy: 'admin-1',
      createdAt: createdAt - 1000 * 60 * 60 * 24 * 5,
      updatedAt: createdAt,
    },
    {
      id: generateId(),
      title: 'Neon Pulse',
      description: 'Световые эффекты и туманные дымки для вечерних съёмок.',
      categoryId: categories[1].id,
      coverImageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
      isPaid: false,
      priceCents: undefined,
      isActive: true,
      createdBy: 'admin-1',
      createdAt: createdAt - 1000 * 60 * 60 * 24 * 4,
      updatedAt: createdAt - 1000 * 60 * 60 * 24 * 1,
    },
  ];

  const overlays: OverlayAsset[] = [
    {
      id: generateId(),
      setId: sets[0].id,
      kind: 'image',
      value: 'https://images.unsplash.com/photo-1517816980727-928d5434107f?auto=format&fit=crop&w=600&q=80',
      aspectRatio: 1.5,
      orderIndex: 1,
      isActive: true,
      createdAt: createdAt - 1000 * 60 * 60 * 24 * 5,
      updatedAt: createdAt - 1000 * 60 * 60 * 24 * 2,
    },
    {
      id: generateId(),
      setId: sets[0].id,
      kind: 'css',
      value: 'radial-gradient(circle, rgba(255,183,77,0.85) 0%, rgba(255,82,82,0.25) 70%)',
      aspectRatio: undefined,
      orderIndex: 2,
      isActive: true,
      createdAt: createdAt - 1000 * 60 * 60 * 24 * 4,
      updatedAt: createdAt - 1000 * 60 * 60 * 24 * 1,
    },
    {
      id: generateId(),
      setId: sets[0].id,
      kind: 'css',
      value: 'linear-gradient(120deg, rgba(255, 200, 87, 0.6) 0%, rgba(255, 105, 135, 0.4) 50%, rgba(255, 200, 87, 0.1) 100%)',
      aspectRatio: undefined,
      orderIndex: 3,
      isActive: true,
      createdAt: createdAt - 1000 * 60 * 60 * 24 * 3,
      updatedAt: createdAt - 1000 * 60 * 60 * 24 * 1,
    },
    {
      id: generateId(),
      setId: sets[0].id,
      kind: 'image',
      value: 'https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&w=600&q=80',
      aspectRatio: 1.2,
      orderIndex: 4,
      isActive: true,
      createdAt: createdAt - 1000 * 60 * 60 * 24 * 2,
      updatedAt: createdAt - 1000 * 60 * 60 * 24 * 1,
    },
    {
      id: generateId(),
      setId: sets[1].id,
      kind: 'image',
      value: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
      aspectRatio: 0.9,
      orderIndex: 1,
      isActive: true,
      createdAt: createdAt - 1000 * 60 * 60 * 24 * 3,
      updatedAt: createdAt - 1000 * 60 * 60 * 24 * 1,
    },
    {
      id: generateId(),
      setId: sets[1].id,
      kind: 'css',
      value: 'radial-gradient(circle at 20% 20%, rgba(130, 87, 255, 0.65), rgba(49, 57, 255, 0) 55%)',
      aspectRatio: undefined,
      orderIndex: 2,
      isActive: true,
      createdAt: createdAt - 1000 * 60 * 60 * 24 * 2,
      updatedAt: createdAt - 1000 * 60 * 60 * 24 * 1,
    },
    {
      id: generateId(),
      setId: sets[1].id,
      kind: 'image',
      value: 'https://images.unsplash.com/photo-1475776408506-9a5371e7a068?auto=format&fit=crop&w=600&q=80',
      aspectRatio: 1.6,
      orderIndex: 3,
      isActive: true,
      createdAt: createdAt - 1000 * 60 * 60 * 24 * 2,
      updatedAt: createdAt - 1000 * 60 * 60 * 24 * 1,
    },
  ];

  const purchases: PurchaseRecord[] = [
    {
      id: generateId(),
      userId: 'user-1',
      setId: sets[0].id,
      priceCents: 1299,
      currency: 'RUB',
      status: 'succeeded',
      provider: 'stripe',
      providerTxnId: `txn_${Math.random().toString(36).slice(2, 10)}`,
      createdAt: createdAt - 1000 * 60 * 60 * 12,
    },
  ];

  const usage: UsageStat[] = [
    {
      id: generateId(),
      userId: 'user-1',
      clientId: 'web-123',
      setId: sets[0].id,
      overlayId: overlays[0].id,
      action: 'export',
      meta: { format: 'png' },
      createdAt: createdAt - 1000 * 60 * 15,
    },
  ];

  const paymentMethods: Array<PaymentMethod & { userId: string }> = [
    {
      id: generateId(),
      userId: 'user-1',
      brand: 'Visa',
      last4: '4242',
      expMonth: 10,
      expYear: new Date().getFullYear() + 2,
      isDefault: true,
    },
    {
      id: generateId(),
      userId: 'user-1',
      brand: 'Mir',
      last4: '1234',
      expMonth: 4,
      expYear: new Date().getFullYear() + 1,
      isDefault: false,
    },
  ];

  const shares: SharedRender[] = [
    {
      id: generateId(),
      userId: 'user-1',
      createdAt: Date.now() - 1000 * 60 * 60,
      title: 'Sunset Stories — демо',
      imageData:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAdklEQVR4nO3RAQ0AAAgDINc/9M2hHFQg8Lbt3gIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMBx4ZoAAeXkzQgAAAAASUVORK5CYII=',
    },
  ];

  return { categories, sets, overlays, purchases, usage, paymentMethods, shares };
}

function ensureDatabase(): MockDatabase {
  if (dbCache) {
    return dbCache;
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        dbCache = JSON.parse(raw) as MockDatabase;
        dbCache.paymentMethods ??= [];
        dbCache.shares ??= [];
        return dbCache;
      }
    } catch (error) {
      console.warn('Не удалось загрузить mock-базу, используем дефолтную', error);
    }
  }

  dbCache = createDefaultDatabase();
  persist(dbCache);
  return dbCache;
}

function persist(next: MockDatabase) {
  dbCache = deepClone(next);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dbCache));
  }
}

async function simulateDelay() {
  await new Promise((resolve) => setTimeout(resolve, 250 + Math.random() * 250));
}

function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase().replace(/\s+/g, '-');
}

export const mockApi = {
  async listCategories(): Promise<CatalogCategory[]> {
    await simulateDelay();
    const db = ensureDatabase();
    return deepClone(db.categories.sort((a, b) => a.orderIndex - b.orderIndex));
  },
  async createCategory(input: CategoryInput): Promise<CatalogCategory> {
    await simulateDelay();
    const db = ensureDatabase();
    const exists = db.categories.some((category) => category.slug === normalizeSlug(input.slug));
    if (exists) {
      throw new Error('Категория с таким slug уже существует');
    }
    const category: CatalogCategory = {
      id: generateId(),
      name: input.name.trim(),
      slug: normalizeSlug(input.slug),
      orderIndex: input.orderIndex ?? db.categories.length + 1,
      createdAt: now(),
      updatedAt: now(),
    };
    const next: MockDatabase = {
      ...db,
      categories: [...db.categories, category],
    };
    persist(next);
    return deepClone(category);
  },
  async updateCategory(id: string, patch: Partial<CategoryInput>): Promise<CatalogCategory> {
    await simulateDelay();
    const db = ensureDatabase();
    const category = db.categories.find((item) => item.id === id);
    if (!category) {
      throw new Error('Категория не найдена');
    }
    const updated: CatalogCategory = {
      ...category,
      name: patch.name !== undefined ? patch.name.trim() : category.name,
      slug: patch.slug !== undefined ? normalizeSlug(patch.slug) : category.slug,
      orderIndex: patch.orderIndex ?? category.orderIndex,
      updatedAt: now(),
    };
    const next: MockDatabase = {
      ...db,
      categories: db.categories.map((item) => (item.id === id ? updated : item)),
    };
    persist(next);
    return deepClone(updated);
  },
  async deleteCategory(id: string): Promise<void> {
    await simulateDelay();
    const db = ensureDatabase();
    const nextSets = db.sets.map((set) => (set.categoryId === id ? { ...set, categoryId: undefined } : set));
    const next: MockDatabase = {
      ...db,
      categories: db.categories.filter((item) => item.id !== id),
      sets: nextSets,
    };
    persist(next);
  },
  async listSets(): Promise<OverlaySetSummary[]> {
    await simulateDelay();
    const db = ensureDatabase();
    const sets = [...db.sets].sort((a, b) => b.updatedAt - a.updatedAt);
    return deepClone(sets);
  },
  async listCatalog(options?: { includeInactive?: boolean }): Promise<OverlayCatalogSnapshot> {
    await simulateDelay();
    const includeInactive = options?.includeInactive ?? false;
    const db = ensureDatabase();

    const overlaysBySet = new Map<string, OverlayAsset[]>();
    db.overlays
      .filter((overlay) => includeInactive || overlay.isActive)
      .forEach((overlay) => {
        const bucket = overlaysBySet.get(overlay.setId) ?? [];
        bucket.push(overlay);
        overlaysBySet.set(overlay.setId, bucket);
      });

    overlaysBySet.forEach((items, setId) => {
      overlaysBySet.set(
        setId,
        [...items].sort((a, b) => a.orderIndex - b.orderIndex),
      );
    });

    const sets: OverlaySetWithAssets[] = db.sets
      .filter((set) => includeInactive || set.isActive)
      .map<OverlaySetWithAssets>((set) => ({
        ...set,
        overlays: deepClone(overlaysBySet.get(set.id) ?? []),
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);

    const categories: CatalogCategoryWithSets[] = db.categories
      .slice()
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map<CatalogCategoryWithSets>((category) => ({
        ...category,
        sets: sets.filter((set) => set.categoryId === category.id),
      }));

    const uncategorized = sets.filter((set) => !set.categoryId);

    return {
      categories: deepClone(categories),
      uncategorized: deepClone(uncategorized),
    };
  },
  async createSet(input: SetInput): Promise<OverlaySetSummary> {
    await simulateDelay();
    const db = ensureDatabase();
    const set: OverlaySetSummary = {
      id: generateId(),
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      categoryId: input.categoryId || undefined,
      coverImageUrl: input.coverImageUrl?.trim() || undefined,
      isPaid: input.isPaid,
      priceCents: input.isPaid ? input.priceCents ?? 0 : undefined,
      isActive: input.isActive,
      createdBy: 'admin-1',
      createdAt: now(),
      updatedAt: now(),
    };
    const next: MockDatabase = { ...db, sets: [...db.sets, set] };
    persist(next);
    return deepClone(set);
  },
  async updateSet(id: string, patch: Partial<SetInput>): Promise<OverlaySetSummary> {
    await simulateDelay();
    const db = ensureDatabase();
    const current = db.sets.find((set) => set.id === id);
    if (!current) throw new Error('Набор не найден');
    const updated: OverlaySetSummary = {
      ...current,
      title: patch.title !== undefined ? patch.title.trim() : current.title,
      description: patch.description !== undefined ? patch.description?.trim() : current.description,
      categoryId: patch.categoryId !== undefined ? patch.categoryId || undefined : current.categoryId,
      coverImageUrl: patch.coverImageUrl !== undefined ? patch.coverImageUrl?.trim() || undefined : current.coverImageUrl,
      isPaid: patch.isPaid !== undefined ? patch.isPaid : current.isPaid,
      priceCents: (patch.isPaid ?? current.isPaid) ? patch.priceCents ?? current.priceCents ?? 0 : undefined,
      isActive: patch.isActive !== undefined ? patch.isActive : current.isActive,
      updatedAt: now(),
    };
    const next: MockDatabase = {
      ...db,
      sets: db.sets.map((set) => (set.id === id ? updated : set)),
    };
    persist(next);
    return deepClone(updated);
  },
  async deleteSet(id: string): Promise<void> {
    await simulateDelay();
    const db = ensureDatabase();
    const next: MockDatabase = {
      ...db,
      sets: db.sets.filter((set) => set.id !== id),
      overlays: db.overlays.filter((overlay) => overlay.setId !== id),
    };
    persist(next);
  },
  async listOverlays(setId: string): Promise<OverlayAsset[]> {
    await simulateDelay();
    const db = ensureDatabase();
    const overlays = db.overlays.filter((overlay) => overlay.setId === setId).sort((a, b) => a.orderIndex - b.orderIndex);
    return deepClone(overlays);
  },
  async createOverlay(input: OverlayInput): Promise<OverlayAsset> {
    await simulateDelay();
    const db = ensureDatabase();
    const overlay: OverlayAsset = {
      id: generateId(),
      setId: input.setId,
      kind: input.kind,
      value: input.value.trim(),
      aspectRatio: input.aspectRatio,
      orderIndex: input.orderIndex ?? db.overlays.filter((item) => item.setId === input.setId).length + 1,
      isActive: input.isActive,
      createdAt: now(),
      updatedAt: now(),
    };
    const next: MockDatabase = {
      ...db,
      overlays: [...db.overlays, overlay],
    };
    persist(next);
    return deepClone(overlay);
  },
  async updateOverlay(id: string, patch: Partial<OverlayInput>): Promise<OverlayAsset> {
    await simulateDelay();
    const db = ensureDatabase();
    const current = db.overlays.find((overlay) => overlay.id === id);
    if (!current) throw new Error('Оверлей не найден');
    const updated: OverlayAsset = {
      ...current,
      kind: patch.kind ?? current.kind,
      value: patch.value !== undefined ? patch.value.trim() : current.value,
      aspectRatio: patch.aspectRatio ?? current.aspectRatio,
      orderIndex: patch.orderIndex ?? current.orderIndex,
      isActive: patch.isActive ?? current.isActive,
      updatedAt: now(),
    };
    const next: MockDatabase = {
      ...db,
      overlays: db.overlays.map((overlay) => (overlay.id === id ? updated : overlay)),
    };
    persist(next);
    return deepClone(updated);
  },
  async deleteOverlay(id: string): Promise<void> {
    await simulateDelay();
    const db = ensureDatabase();
    const next: MockDatabase = { ...db, overlays: db.overlays.filter((overlay) => overlay.id !== id) };
    persist(next);
  },
  async summary(): Promise<SummaryStats> {
    await simulateDelay();
    const db = ensureDatabase();
    const totalRevenueCents = db.purchases.filter((purchase) => purchase.status === 'succeeded').reduce((acc, purchase) => acc + purchase.priceCents, 0);
    const activeCustomers = new Set(db.purchases.filter((purchase) => purchase.status === 'succeeded').map((purchase) => purchase.userId)).size;
    return {
      totalCategories: db.categories.length,
      totalSets: db.sets.length,
      totalOverlays: db.overlays.length,
      totalRevenueCents,
      activeCustomers,
    };
  },
  async listPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    await simulateDelay();
    const db = ensureDatabase();
    return deepClone(db.paymentMethods.filter((method) => method.userId === userId));
  },
  async addPaymentMethod(
    userId: string,
    payload: { brand: string; last4: string; expMonth: number; expYear: number; isDefault?: boolean },
  ): Promise<PaymentMethod> {
    await simulateDelay();
    const db = ensureDatabase();
    const method: PaymentMethod & { userId: string } = {
      id: generateId(),
      userId,
      brand: payload.brand,
      last4: payload.last4,
      expMonth: payload.expMonth,
      expYear: payload.expYear,
      isDefault: Boolean(payload.isDefault),
    };
    const nextMethods = payload.isDefault
      ? db.paymentMethods.map((item) => (item.userId === userId ? { ...item, isDefault: false } : item))
      : [...db.paymentMethods];
    const next: MockDatabase = {
      ...db,
      paymentMethods: [...nextMethods, method],
    };
    persist(next);
    return deepClone(method);
  },
  async updatePaymentMethod(
    userId: string,
    methodId: string,
    patch: Partial<{ brand: string; last4: string; expMonth: number; expYear: number }>,
  ): Promise<PaymentMethod> {
    await simulateDelay();
    const db = ensureDatabase();
    const current = db.paymentMethods.find((item) => item.id === methodId && item.userId === userId);
    if (!current) throw new Error('Способ оплаты не найден');
    const updated: PaymentMethod & { userId: string } = {
      ...current,
      brand: patch.brand ?? current.brand,
      last4: patch.last4 ?? current.last4,
      expMonth: patch.expMonth ?? current.expMonth,
      expYear: patch.expYear ?? current.expYear,
    };
    const next: MockDatabase = {
      ...db,
      paymentMethods: db.paymentMethods.map((item) => (item.id === methodId ? updated : item)),
    };
    persist(next);
    return deepClone(updated);
  },
  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    await simulateDelay();
    const db = ensureDatabase();
    const exists = db.paymentMethods.some((item) => item.id === methodId && item.userId === userId);
    if (!exists) throw new Error('Способ оплаты не найден');
    const next: MockDatabase = {
      ...db,
      paymentMethods: db.paymentMethods.map((item) =>
        item.userId === userId ? { ...item, isDefault: item.id === methodId } : item,
      ),
    };
    persist(next);
  },
  async deletePaymentMethod(userId: string, methodId: string): Promise<void> {
    await simulateDelay();
    const db = ensureDatabase();
    const methods = db.paymentMethods.filter((item) => !(item.id === methodId && item.userId === userId));
    if (methods.length === db.paymentMethods.length) throw new Error('Способ оплаты не найден');
    const hadDefault = db.paymentMethods.some((item) => item.id === methodId && item.userId === userId && item.isDefault);
    if (hadDefault) {
      const first = methods.find((item) => item.userId === userId);
      if (first) {
        first.isDefault = true;
      }
    }
    const next: MockDatabase = {
      ...db,
      paymentMethods: methods,
    };
    persist(next);
  },
  async listPurchasesByUser(userId: string): Promise<PurchaseRecord[]> {
    await simulateDelay();
    const db = ensureDatabase();
    return deepClone(db.purchases.filter((purchase) => purchase.userId === userId).sort((a, b) => b.createdAt - a.createdAt));
  },
  async getPurchaseReceipt(purchaseId: string): Promise<string> {
    await simulateDelay();
    const db = ensureDatabase();
    const purchase = db.purchases.find((item) => item.id === purchaseId);
    if (!purchase) throw new Error('Покупка не найдена');
    const set = db.sets.find((item) => item.id === purchase.setId);
    const issuedAt = new Date(purchase.createdAt).toLocaleString('ru-RU');
    const amount = (purchase.priceCents / 100).toLocaleString('ru-RU', {
      style: 'currency',
      currency: purchase.currency,
    });
    return `Loverlay\nЧек №${purchase.id}\nДата: ${issuedAt}\nПокупатель: ${purchase.userId}\nНабор: ${set?.title ?? purchase.setId}\nСумма: ${amount}\nСтатус: ${purchase.status}`;
  },
  async createShare(payload: { imageData: string; userId?: string; title?: string }): Promise<{ id: string }> {
    await simulateDelay();
    const db = ensureDatabase();
    const share: SharedRender = {
      id: generateId(),
      imageData: payload.imageData,
      createdAt: Date.now(),
      userId: payload.userId,
      title: payload.title,
    };
    const next: MockDatabase = { ...db, shares: [...db.shares, share] };
    persist(next);
    return { id: share.id };
  },
  async getShare(id: string): Promise<SharedRender> {
    await simulateDelay();
    const db = ensureDatabase();
    const share = db.shares.find((item) => item.id === id);
    if (!share) throw new Error('Материал не найден');
    return deepClone(share);
  },
  async listShares(): Promise<SharedRender[]> {
    await simulateDelay();
    const db = ensureDatabase();
    return deepClone(db.shares.sort((a, b) => b.createdAt - a.createdAt));
  },
  async listPurchases(): Promise<PurchaseRecord[]> {
    await simulateDelay();
    const db = ensureDatabase();
    return deepClone(db.purchases.sort((a, b) => b.createdAt - a.createdAt));
  },
  async listUsage(): Promise<UsageStat[]> {
    await simulateDelay();
    const db = ensureDatabase();
    return deepClone(db.usage.sort((a, b) => b.createdAt - a.createdAt));
  },
  async reset(): Promise<void> {
    const fresh = createDefaultDatabase();
    persist(fresh);
  },
};

export type { SummaryStats };
