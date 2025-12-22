import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Search, Download, ExternalLink, Calendar, Package } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Purchase {
  id: string;
  set_id: string;
  set_title: string;
  set_thumbnail?: string;
  price_cents: number;
  created_at: number;
  status: 'completed' | 'pending' | 'refunded';
}

interface PurchasesResponse {
  purchases: Purchase[];
  total: number;
}

async function fetchPurchases(): Promise<PurchasesResponse> {
  const res = await fetch('/api/auth?action=purchases', { credentials: 'include' });
  if (!res.ok) {
    return { purchases: [], total: 0 };
  }
  return res.json();
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  refunded: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const AccountPurchases: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['account-purchases'],
    queryFn: fetchPurchases,
    staleTime: 2 * 60 * 1000,
  });

  const filteredPurchases = React.useMemo(() => {
    if (!data?.purchases) return [];
    if (!searchQuery.trim()) return data.purchases;
    
    const query = searchQuery.toLowerCase();
    return data.purchases.filter(p => 
      p.set_title.toLowerCase().includes(query)
    );
  }, [data?.purchases, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-fuchsia-600/20">
            <ShoppingBag className="h-5 w-5 text-fuchsia-400" />
          </div>
          {t('account.purchases')}
        </h1>
        <p className="text-white/60 mt-1">{t('account.purchases_description')}</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder={t('account.search_purchases')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-violet-500/50"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-600/20">
                <Package className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? <Skeleton className="h-7 w-12 bg-white/10" /> : data?.total ?? 0}
                </div>
                <div className="text-xs text-white/50">{t('account.total_purchases')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600/20">
                <Calendar className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 bg-white/10" />
                  ) : data?.purchases?.[0] ? (
                    new Date(data.purchases[0].created_at).toLocaleDateString()
                  ) : '-'}
                </div>
                <div className="text-xs text-white/50">{t('account.last_purchase')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-fuchsia-600/20">
                <ShoppingBag className="h-5 w-5 text-fuchsia-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {isLoading ? (
                    <Skeleton className="h-7 w-16 bg-white/10" />
                  ) : data?.purchases ? (
                    `$${(data.purchases.reduce((sum, p) => sum + p.price_cents, 0) / 100).toFixed(2)}`
                  ) : '$0'}
                </div>
                <div className="text-xs text-white/50">{t('account.total_spent')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchases List */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">{t('account.purchase_history')}</CardTitle>
          <CardDescription className="text-white/50">
            {t('account.all_your_purchases')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
                  <Skeleton className="h-16 w-16 rounded-lg bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 bg-white/10" />
                    <Skeleton className="h-3 w-24 bg-white/10" />
                  </div>
                  <Skeleton className="h-6 w-16 bg-white/10" />
                </div>
              ))}
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                <ShoppingBag className="h-8 w-8 text-white/30" />
              </div>
              <h3 className="text-lg font-medium text-white mb-1">
                {searchQuery ? t('account.no_results') : t('account.no_purchases')}
              </h3>
              <p className="text-white/50 text-sm">
                {searchQuery 
                  ? t('account.try_different_search')
                  : t('account.no_purchases_desc')
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPurchases.map((purchase) => (
                <div 
                  key={purchase.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {purchase.set_thumbnail ? (
                      <img 
                        src={purchase.set_thumbnail} 
                        alt={purchase.set_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-white/30" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white truncate">{purchase.set_title}</h4>
                      <Badge variant="outline" className={statusColors[purchase.status]}>
                        {t(`account.status_${purchase.status}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </span>
                      <span>ID: {purchase.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-semibold text-violet-400">
                        ${(purchase.price_cents / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                        title={t('account.download')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                        title={t('account.open_set')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPurchases;

