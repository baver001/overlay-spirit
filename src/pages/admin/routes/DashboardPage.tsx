import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

import { fetchWithAuth } from "@/lib/api";

type Range = "7d" | "30d" | "90d" | "365d";

const rangeOptions: Array<{ value: Range; label: string }> = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
  { value: "365d", label: "1 год" },
];

interface StatsResponse {
  stats: {
    categories: number;
    sets: number;
    paid_sets: number;
    active_sets: number;
    draft_sets: number;
    total_purchases: number;
    revenue_cents: number;
    new_users: number;
    active_customers: number;
    range: Range;
  };
}

interface DashboardResponse {
  range: Range;
  since: number;
  purchasesByDay: Array<{ day: string; count: number }>;
  revenueByDay: Array<{ day: string; revenue_cents: number }>;
  topSets: Array<{ id: string; title: string; sales_count: number | null; revenue_cents: number | null }>;
  recentActivity: Array<{ id: string; action: string; entity: string; entity_id: string | null; created_at: number; email: string | null }>;
}

async function fetchStats(range: Range): Promise<StatsResponse> {
  const res = await fetchWithAuth(`/api/admin?list=stats&range=${range}`, { credentials: "include" });
  if (!res.ok) throw new Error("Не удалось загрузить статистику");
  return res.json();
}

async function fetchDashboard(range: Range): Promise<DashboardResponse> {
  const res = await fetchWithAuth(`/api/admin?list=dashboard&range=${range}`, { credentials: "include" });
  if (!res.ok) throw new Error("Не удалось загрузить дашборд");
  return res.json();
}

function useRangeState(): [Range, (value: Range) => void] {
  const [range, setRange] = React.useState<Range>(() => {
    const stored = window.sessionStorage.getItem("admin.range") as Range | null;
    return stored || "30d";
  });

  const update = React.useCallback((value: Range) => {
    window.sessionStorage.setItem("admin.range", value);
    setRange(value);
  }, []);

  return [range, update];
}

const currency = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const DashboardPage: React.FC = () => {
  const [range, setRange] = useRangeState();

  const statsQuery = useQuery({
    queryKey: ["admin", "stats", range],
    queryFn: () => fetchStats(range),
    keepPreviousData: true,
  });

  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard", range],
    queryFn: () => fetchDashboard(range),
    keepPreviousData: true,
  });

  const purchasesChartData = useMemo(() => {
    if (!dashboardQuery.data) return [];
    return dashboardQuery.data.purchasesByDay.map((item, index) => ({
      index,
      day: item.day,
      count: item.count,
    }));
  }, [dashboardQuery.data]);

  const revenueChartData = useMemo(() => {
    if (!dashboardQuery.data) return [];
    return dashboardQuery.data.revenueByDay.map((item, index) => ({
      index,
      day: item.day,
      revenue: item.revenue_cents / 100,
    }));
  }, [dashboardQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
          <p className="text-muted-foreground text-sm">Свежая статистика по каталогу, пользователям и продажам</p>
        </div>
        <Select value={range} onValueChange={(value) => setRange(value as Range)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Выберите период" />
          </SelectTrigger>
          <SelectContent>
            {rangeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)
        ) : statsQuery.data ? (
          <>
            <StatCard title="Категории" value={statsQuery.data.stats.categories} />
            <StatCard title="Наборы" value={statsQuery.data.stats.sets} description={`${statsQuery.data.stats.active_sets} активных, ${statsQuery.data.stats.draft_sets} черновиков`} />
            <StatCard title="Покупки" value={statsQuery.data.stats.total_purchases} description={`${statsQuery.data.stats.active_customers} покупателей`} />
            <StatCard title="Выручка" value={currency.format(statsQuery.data.stats.revenue_cents / 100)} description={`${statsQuery.data.stats.new_users} новых пользователей`} />
          </>
        ) : (
          <ErrorState message="Не удалось загрузить статистику" />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Покупки</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dashboardQuery.isLoading ? (
              <Skeleton className="h-64" />
            ) : purchasesChartData.length ? (
              <ChartContainer
                config={{ count: { label: "Покупки", color: "stroke hsl(var(--primary)) fill hsl(var(--primary) / 0.15)" } }}
                className="h-64"
              >
                <ResponsiveContainer>
                  <AreaChart data={purchasesChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={30} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <EmptyState message="Нет данных для отображения" />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Выручка</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dashboardQuery.isLoading ? (
              <Skeleton className="h-64" />
            ) : revenueChartData.length ? (
              <ChartContainer
                config={{ revenue: { label: "Выручка", color: "stroke hsl(var(--primary)) fill hsl(var(--primary) / 0.15)" } }}
                className="h-64"
              >
                <ResponsiveContainer>
                  <AreaChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={30} />
                    <YAxis tickFormatter={(value) => currency.format(value).replace("$,", "$ ")} tickLine={false} axisLine={false} tickMargin={8} width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <EmptyState message="Нет данных по выручке" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Лучшие наборы</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dashboardQuery.isLoading ? (
              <Skeleton className="h-64" />
            ) : dashboardQuery.data?.topSets?.length ? (
              <div className="space-y-3">
                {dashboardQuery.data.topSets.map((set) => (
                  <div key={set.id} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{set.title}</div>
                      <div className="text-xs text-muted-foreground">{set.sales_count ?? 0} продаж</div>
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {currency.format((set.revenue_cents ?? 0) / 100)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Нет активных продаж" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Журнал действий</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {dashboardQuery.isLoading ? (
              <Skeleton className="h-64" />
            ) : dashboardQuery.data?.recentActivity?.length ? (
              <div className="space-y-3">
                {dashboardQuery.data.recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between rounded-lg border border-border/60 px-4 py-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {entry.action}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.entity} {entry.entity_id ? `#${entry.entity_id}` : ""}
                      </div>
                      {entry.email && (
                        <div className="text-xs text-muted-foreground">{entry.email}</div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Пока нет действий" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number | string; description?: string }> = ({ title, value, description }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
    {message}
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-32 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive">
    {message}
  </div>
);

