import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth } from "@/lib/api";
import { currencyFormat } from "../utils/format";

interface PurchaseRow {
  id: string;
  user_id: string;
  set_id: string;
  price_cents: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_txn_id: string | null;
  created_at: number;
}

export const PurchasesPage: React.FC = () => {
  const purchasesQuery = useQuery<{ items: PurchaseRow[]; meta: { total: number } }>({
    queryKey: ["admin", "purchases"],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/admin?list=purchases&limit=200`, { credentials: "include" });
      if (!res.ok) throw new Error("Не удалось загрузить покупки");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Покупки</h1>
        <p className="text-sm text-muted-foreground">Контролируйте состояние заказов и выручку.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Журнал покупок</CardTitle>
        </CardHeader>
        <CardContent>
          {purchasesQuery.isLoading ? (
            <Skeleton className="h-48" />
          ) : purchasesQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Не удалось загрузить покупки.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Пользователь</TableHead>
                  <TableHead className="hidden md:table-cell">Набор</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead className="hidden lg:table-cell">Статус</TableHead>
                  <TableHead className="hidden xl:table-cell">Провайдер</TableHead>
                  <TableHead className="hidden xl:table-cell">Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchasesQuery.data?.items.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.user_id}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{purchase.set_id}</TableCell>
                    <TableCell>{currencyFormat(purchase.price_cents, purchase.currency)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant={purchase.status === "paid" ? "default" : purchase.status === "pending" ? "secondary" : "destructive"}>
                        {purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {purchase.provider ?? "—"}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {new Date(purchase.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

