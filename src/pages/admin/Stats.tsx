import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/lib/mockApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const AdminStats: React.FC = () => {
  const summaryQuery = useQuery({
    queryKey: ['admin-summary'],
    queryFn: () => mockApi.summary(),
  });

  const setsQuery = useQuery({
    queryKey: ['admin-sets'],
    queryFn: () => mockApi.listSets(),
  });

  const purchasesQuery = useQuery({
    queryKey: ['admin-purchases'],
    queryFn: () => mockApi.listPurchases(),
  });

  const usageQuery = useQuery({
    queryKey: ['admin-usage'],
    queryFn: () => mockApi.listUsage(),
  });

  const revenueBySet = useMemo(() => {
    const map = new Map<string, { title: string; count: number; revenue: number }>();
    if (!purchasesQuery.data) return [];
    purchasesQuery.data.forEach((purchase) => {
      const set = setsQuery.data?.find((item) => item.id === purchase.setId);
      const entry = map.get(purchase.setId) ?? {
        title: set?.title ?? 'Неизвестный набор',
        count: 0,
        revenue: 0,
      };
      entry.count += 1;
      entry.revenue += purchase.priceCents;
      map.set(purchase.setId, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [purchasesQuery.data, setsQuery.data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Статистика</h1>
        <p className="text-sm text-muted-foreground">
          Отслеживайте конверсию наборов, выручку и активность пользователей на основе mock-данных.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryQuery.isLoading &&
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
        {summaryQuery.data && (
          <>
            <Card>
              <CardHeader>
                <CardDescription>Общая выручка</CardDescription>
                <CardTitle className="text-3xl font-bold">
                  {(summaryQuery.data.totalRevenueCents / 100).toLocaleString('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                  })}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Активных клиентов</CardDescription>
                <CardTitle className="text-3xl font-bold">{summaryQuery.data.activeCustomers}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Наборов в каталоге</CardDescription>
                <CardTitle className="text-3xl font-bold">{summaryQuery.data.totalSets}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Оверлеев</CardDescription>
                <CardTitle className="text-3xl font-bold">{summaryQuery.data.totalOverlays}</CardTitle>
              </CardHeader>
            </Card>
          </>
        )}
      </div>

      <Card className="bg-background/80">
        <CardHeader>
          <CardTitle>Топ наборов по выручке</CardTitle>
          <CardDescription>Рассчитано на основе успешных покупок.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Набор</TableHead>
                <TableHead className="w-32 text-right">Продаж</TableHead>
                <TableHead className="w-40 text-right">Выручка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueBySet.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                    Нет данных о покупках.
                  </TableCell>
                </TableRow>
              )}
              {revenueBySet.map((item) => (
                <TableRow key={item.title}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                  <TableCell className="text-right">
                    {(item.revenue / 100).toLocaleString('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Последние покупки</CardTitle>
            <CardDescription>Отображаются успешные транзакции.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Набор</TableHead>
                  <TableHead className="hidden sm:table-cell">Провайдер</TableHead>
                  <TableHead className="w-36 text-right">Сумма</TableHead>
                  <TableHead className="w-40 text-right">Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchasesQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      Загружаем покупки...
                    </TableCell>
                  </TableRow>
                )}
                {(!purchasesQuery.data || purchasesQuery.data.length === 0) && !purchasesQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                      Пока нет успешных транзакций.
                    </TableCell>
                  </TableRow>
                )}
                {purchasesQuery.data?.map((purchase) => {
                  const set = setsQuery.data?.find((item) => item.id === purchase.setId);
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{set?.title ?? 'Неизвестный набор'}</span>
                          <span className="text-xs text-muted-foreground">{purchase.providerTxnId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">{purchase.provider ?? '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {(purchase.priceCents / 100).toLocaleString('ru-RU', {
                          style: 'currency',
                          currency: purchase.currency ?? 'RUB',
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(purchase.createdAt).toLocaleString('ru-RU')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-background/80">
          <CardHeader>
            <CardTitle>Активность пользователей</CardTitle>
            <CardDescription>Недавние действия в редакторе.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {usageQuery.isLoading && <Skeleton className="h-24 rounded-lg" />}
            {(!usageQuery.data || usageQuery.data.length === 0) && !usageQuery.isLoading && (
              <p className="py-6 text-center text-sm text-muted-foreground">Записей активности пока нет.</p>
            )}
            {usageQuery.data?.map((event) => {
              const set = setsQuery.data?.find((item) => item.id === event.setId);
              return (
                <div key={event.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{event.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Набор: {set?.title ?? '—'} {event.overlayId ? `• Оверлей ${event.overlayId.slice(0, 6)}` : ''}
                  </p>
                  {event.meta && (
                    <pre className="mt-2 max-h-32 overflow-auto rounded bg-muted/60 p-2 text-xs text-muted-foreground">
                      {JSON.stringify(event.meta, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStats;
