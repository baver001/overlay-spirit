import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, ImagePlus, Sparkles, ArrowRight, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface AccountStats {
  totalPurchases: number;
  totalSets: number;
  recentPurchases: Array<{
    id: string;
    set_title: string;
    created_at: number;
    price_cents: number;
  }>;
}

async function fetchAccountStats(): Promise<AccountStats> {
  const res = await fetch('/api/auth?action=stats', { credentials: 'include' });
  if (!res.ok) {
    // Если endpoint не существует, возвращаем пустые данные
    return { totalPurchases: 0, totalSets: 0, recentPurchases: [] };
  }
  return res.json();
}

export const AccountDashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['account-stats'],
    queryFn: fetchAccountStats,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent border border-white/10 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/20 to-transparent rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-violet-400 text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" />
            {t('account.welcome_back')}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {user?.email?.split('@')[0] || t('account.user')}
          </h1>
          <p className="text-white/60 max-w-lg">
            {t('account.dashboard_description')}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">{t('account.my_sets')}</CardTitle>
            <Package className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 bg-white/10" />
            ) : (
              <div className="text-2xl font-bold text-white">{data?.totalSets ?? 0}</div>
            )}
            <p className="text-xs text-white/40 mt-1">{t('account.sets_available')}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/60">{t('account.purchases_count')}</CardTitle>
            <ShoppingBag className="h-4 w-4 text-fuchsia-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20 bg-white/10" />
            ) : (
              <div className="text-2xl font-bold text-white">{data?.totalPurchases ?? 0}</div>
            )}
            <p className="text-xs text-white/40 mt-1">{t('account.all_time')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-900/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">{t('account.quick_actions')}</CardTitle>
          <CardDescription className="text-white/50">{t('account.quick_actions_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Link to="/editor">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-auto py-4 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-violet-500/50 transition-all"
            >
              <div className="p-2 rounded-lg bg-violet-600/20">
                <ImagePlus className="h-5 w-5 text-violet-400" />
              </div>
              <div className="text-left">
                <div className="font-medium">{t('account.open_editor')}</div>
                <div className="text-xs text-white/50">{t('account.create_overlay')}</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-white/40" />
            </Button>
          </Link>
          
          <Link to="/account/purchases">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-auto py-4 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-fuchsia-500/50 transition-all"
            >
              <div className="p-2 rounded-lg bg-fuchsia-600/20">
                <ShoppingBag className="h-5 w-5 text-fuchsia-400" />
              </div>
              <div className="text-left">
                <div className="font-medium">{t('account.view_purchases')}</div>
                <div className="text-xs text-white/50">{t('account.purchase_history')}</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-white/40" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Purchases */}
      {data?.recentPurchases && data.recentPurchases.length > 0 && (
        <Card className="bg-slate-900/50 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">{t('account.recent_purchases')}</CardTitle>
              <CardDescription className="text-white/50">{t('account.last_purchases')}</CardDescription>
            </div>
            <Link to="/account/purchases">
              <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 hover:bg-violet-600/10">
                {t('account.view_all')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentPurchases.slice(0, 3).map((purchase) => (
                <div 
                  key={purchase.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                >
                  <div>
                    <div className="font-medium text-white">{purchase.set_title}</div>
                    <div className="text-xs text-white/40">
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-violet-400">
                    ${(purchase.price_cents / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccountDashboard;

