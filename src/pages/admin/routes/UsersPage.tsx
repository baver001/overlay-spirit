import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  created_at: number;
  updated_at: number;
}

export const UsersPage: React.FC = () => {
  const usersQuery = useQuery<{ items: AdminUserRow[]; meta: { total: number } }>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch(`/api/admin?list=users&limit=200`, { credentials: "include" });
      if (!res.ok) throw new Error("Не удалось загрузить пользователей");
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <p className="text-sm text-muted-foreground">Отслеживайте активность и роли покупателей.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <Skeleton className="h-48" />
          ) : usersQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Не удалось загрузить пользователей.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Роль</TableHead>
                  <TableHead className="hidden md:table-cell">Создан</TableHead>
                  <TableHead className="hidden lg:table-cell">Обновлён</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.data?.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {new Date(user.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {new Date(user.updated_at).toLocaleString()}
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

