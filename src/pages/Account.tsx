import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { mockApi } from '@/lib/mockApi';
import { PaymentMethod } from '@/lib/types';
import { CreditCard, Download } from 'lucide-react';

interface PaymentMethodFormState {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

const defaultMethodState: PaymentMethodFormState = {
  brand: '',
  last4: '',
  expMonth: 1,
  expYear: new Date().getFullYear(),
  isDefault: false,
};

const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [methodForm, setMethodForm] = useState<PaymentMethodFormState>(defaultMethodState);

  const isAuthenticated = Boolean(user);

  const paymentMethodsQuery = useQuery({
    queryKey: ['account', user?.id, 'methods'],
    queryFn: () => mockApi.listPaymentMethods(user!.id),
    enabled: isAuthenticated,
  });

  const purchasesQuery = useQuery({
    queryKey: ['account', user?.id, 'purchases'],
    queryFn: () => mockApi.listPurchasesByUser(user!.id),
    enabled: isAuthenticated,
  });

  const setsQuery = useQuery({
    queryKey: ['admin-sets'],
    queryFn: () => mockApi.listSets(),
  });

  const totalSpent = useMemo(() => {
    return purchasesQuery.data?.reduce((acc, purchase) => acc + purchase.priceCents, 0) ?? 0;
  }, [purchasesQuery.data]);

  const totalPurchases = purchasesQuery.data?.length ?? 0;

  const openCreateDialog = () => {
    setEditingMethod(null);
    setMethodForm(defaultMethodState);
    setMethodDialogOpen(true);
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setMethodForm({
      brand: method.brand,
      last4: method.last4,
      expMonth: method.expMonth,
      expYear: method.expYear,
      isDefault: method.isDefault,
    });
    setMethodDialogOpen(true);
  };

  const closeDialog = () => {
    setMethodDialogOpen(false);
    setEditingMethod(null);
    setMethodForm(defaultMethodState);
  };

  const addMethodMutation = useMutation({
    mutationFn: (payload: PaymentMethodFormState) =>
      mockApi.addPaymentMethod(user!.id, {
        brand: payload.brand,
        last4: payload.last4,
        expMonth: payload.expMonth,
        expYear: payload.expYear,
        isDefault: payload.isDefault,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', user?.id, 'methods'] });
      toast({ title: 'Способ оплаты добавлен', description: 'Карта успешно сохранена.' });
      closeDialog();
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось добавить карту', variant: 'destructive' });
    },
  });

  const updateMethodMutation = useMutation({
    mutationFn: (payload: PaymentMethodFormState) =>
      mockApi.updatePaymentMethod(user!.id, editingMethod!.id, {
        brand: payload.brand,
        last4: payload.last4,
        expMonth: payload.expMonth,
        expYear: payload.expYear,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', user?.id, 'methods'] });
      toast({ title: 'Способ оплаты обновлён' });
      closeDialog();
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось обновить карту', variant: 'destructive' });
    },
  });

  const deleteMethodMutation = useMutation({
    mutationFn: (methodId: string) => mockApi.deletePaymentMethod(user!.id, methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', user?.id, 'methods'] });
      toast({ title: 'Способ оплаты удалён' });
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось удалить карту', variant: 'destructive' });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (methodId: string) => mockApi.setDefaultPaymentMethod(user!.id, methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', user?.id, 'methods'] });
      toast({ title: 'Основной способ обновлён' });
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось обновить основной способ', variant: 'destructive' });
    },
  });

  const handleDownloadReceipt = async (purchaseId: string) => {
    try {
      const receipt = await mockApi.getPurchaseReceipt(purchaseId);
      const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${purchaseId}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось сформировать чек', variant: 'destructive' });
    }
  };

  const handleSubmitMethod = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingMethod) {
      updateMethodMutation.mutate(methodForm);
    } else {
      addMethodMutation.mutate(methodForm);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl flex-col gap-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Личный кабинет</h1>
        <p className="text-muted-foreground">
          Управляйте профилем, способами оплаты и загрузками наборов. Все данные сохраняются локально и используются в демо-режиме.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Всего покупок</CardTitle>
            <CardDescription>Наборы, оплаченные через платформу.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalPurchases}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Сумма расходов</CardTitle>
            <CardDescription>Учитываются только успешные транзакции.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {(totalSpent / 100).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
          <CardDescription>Основные сведения об аккаунте.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <span className="font-medium text-foreground">Имя</span>
            <p>{user?.name}</p>
          </div>
          <div>
            <span className="font-medium text-foreground">Email</span>
            <p>{user?.email}</p>
          </div>
          <div>
            <span className="font-medium text-foreground">Роль</span>
            <p>{user?.role === 'admin' ? 'Администратор' : 'Клиент'}</p>
          </div>
          <div>
            <span className="font-medium text-foreground">Дата регистрации</span>
            <p>{user ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Способы оплаты</CardTitle>
            <CardDescription>Добавляйте карты и выбирайте основной способ оплаты.</CardDescription>
          </div>
          <Dialog
            open={methodDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                closeDialog();
              } else {
                setMethodDialogOpen(true);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>Добавить карту</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMethod ? 'Редактировать карту' : 'Добавить карту'}</DialogTitle>
                <DialogDescription>Данные используются только локально для демонстрации.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmitMethod}>
                <div className="space-y-2">
                  <Label htmlFor="pm-brand">Платёжная система</Label>
                  <Input
                    id="pm-brand"
                    required
                    value={methodForm.brand}
                    onChange={(event) => setMethodForm((prev) => ({ ...prev, brand: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pm-last4">Последние 4 цифры</Label>
                  <Input
                    id="pm-last4"
                    required
                    maxLength={4}
                    value={methodForm.last4}
                    onChange={(event) => setMethodForm((prev) => ({ ...prev, last4: event.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pm-exp-month">Месяц</Label>
                    <Input
                      id="pm-exp-month"
                      type="number"
                      min={1}
                      max={12}
                      value={methodForm.expMonth}
                      onChange={(event) => setMethodForm((prev) => ({ ...prev, expMonth: Number(event.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pm-exp-year">Год</Label>
                    <Input
                      id="pm-exp-year"
                      type="number"
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 10}
                      value={methodForm.expYear}
                      onChange={(event) => setMethodForm((prev) => ({ ...prev, expYear: Number(event.target.value) }))}
                    />
                  </div>
                </div>
                {!editingMethod && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={methodForm.isDefault}
                      onChange={(event) => setMethodForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                    />
                    Сделать основным
                  </label>
                )}
                <Button type="submit" className="w-full" disabled={addMethodMutation.isPending || updateMethodMutation.isPending}>
                  {(addMethodMutation.isPending || updateMethodMutation.isPending) ? 'Сохраняем…' : 'Сохранить'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentMethodsQuery.isLoading && <p className="text-sm text-muted-foreground">Загружаем данные...</p>}
          {(!paymentMethodsQuery.data || paymentMethodsQuery.data.length === 0) && !paymentMethodsQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Способы оплаты не добавлены.</p>
          )}
          {paymentMethodsQuery.data?.map((method) => (
            <div key={method.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{method.brand} •••• {method.last4}</p>
                  <p className="text-xs text-muted-foreground">Действует до {String(method.expMonth).padStart(2, '0')}/{method.expYear}</p>
                </div>
                {method.isDefault && <Badge className="bg-emerald-500/15 text-emerald-600">Основной</Badge>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(method)}>
                  Изменить
                </Button>
                {!method.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefaultMutation.mutate(method.id)}
                    disabled={setDefaultMutation.isPending}
                  >
                    Сделать основным
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMethodMutation.mutate(method.id)}
                  disabled={deleteMethodMutation.isPending}
                >
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История покупок</CardTitle>
          <CardDescription>Доступные наборы и статусы оплаты.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Набор</TableHead>
                <TableHead className="hidden sm:table-cell">Статус</TableHead>
                <TableHead className="w-32 text-right">Сумма</TableHead>
                <TableHead className="w-40 text-right">Дата</TableHead>
                <TableHead className="w-40 text-right">Чек</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchasesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    Загружаем историю...
                  </TableCell>
                </TableRow>
              )}
              {(!purchasesQuery.data || purchasesQuery.data.length === 0) && !purchasesQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    Покупок пока нет.
                  </TableCell>
                </TableRow>
              )}
              {purchasesQuery.data?.map((purchase) => {
                const set = setsQuery.data?.find((item) => item.id === purchase.setId);
                return (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{set?.title ?? 'Набор удалён'}</span>
                        <span className="text-xs text-muted-foreground">{purchase.providerTxnId}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={purchase.status === 'succeeded' ? 'default' : 'outline'}>{purchase.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {(purchase.priceCents / 100).toLocaleString('ru-RU', {
                        style: 'currency',
                        currency: purchase.currency,
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(purchase.createdAt).toLocaleString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(purchase.id)}>
                        <Download className="mr-2 h-4 w-4" /> Чек
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;
