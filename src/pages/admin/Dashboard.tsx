import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockApi, SummaryStats } from '@/lib/mockApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

const metricLabels: Array<{ key: keyof SummaryStats; label: string; formatter?: (value: number) => string }> = [
  { key: 'totalCategories', label: 'Рубрик' },
  { key: 'totalSets', label: 'Наборов' },
  { key: 'totalOverlays', label: 'Оверлеев' },
  { key: 'totalRevenueCents', label: 'Выручка', formatter: (value) => `${(value / 100).toFixed(2)} ₽` },
  { key: 'activeCustomers', label: 'Активных клиентов' },
];

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const summaryQuery = useQuery({
    queryKey: ['admin-summary'],
    queryFn: () => mockApi.summary(),
  });

  const handleReset = async () => {
    await mockApi.reset();
    await summaryQuery.refetch();
    toast({
      title: 'Демоданные перезапущены',
      description: 'Mock-база откатилась к исходному состоянию.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Обзор платформы</h1>
          <p className="text-sm text-muted-foreground">
            Следите за ключевыми показателями: количеством рубрик, наборов, активных клиентов и выручкой. Данные обновляются
            автоматически при изменениях в панели управления.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} disabled={summaryQuery.isLoading}>
          Сбросить демоданные
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryQuery.isLoading &&
          metricLabels.map((metric) => <Skeleton key={metric.key} className="h-28 rounded-xl" />)}
        {summaryQuery.data &&
          metricLabels.map((metric) => {
            const value = summaryQuery.data[metric.key];
            const display = typeof value === 'number' ? metric.formatter?.(value) ?? value.toString() : '—';
            return (
              <Card key={metric.key} className="bg-background/90">
                <CardHeader>
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle className="text-3xl font-bold">{display}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
      </div>

      <Card className="border-primary/20 bg-background/80">
        <CardHeader>
          <CardTitle>Как пользоваться демо-панелью</CardTitle>
          <CardDescription>
            Добавляйте новые рубрики, наборы и оверлеи, чтобы увидеть, как показатели вверху обновляются в реальном времени.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Все операции выполняются локально и не требуют подключения к бэкенду. После внедрения Cloudflare D1 mock-слой можно
          будет заменить реальными API без серьёзных изменений в интерфейсе.
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
