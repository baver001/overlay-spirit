import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/mockApi';
import { CatalogCategory, OverlaySetSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PencilLine, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SetFormState {
  id?: string;
  title: string;
  description?: string;
  categoryId?: string;
  coverImageUrl?: string;
  isPaid: boolean;
  priceCents?: number;
  isActive: boolean;
}

const defaultSetState: SetFormState = {
  id: undefined,
  title: '',
  description: '',
  categoryId: undefined,
  coverImageUrl: '',
  isPaid: false,
  priceCents: undefined,
  isActive: true,
};

const AdminSets: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<SetFormState>(defaultSetState);

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => mockApi.listCategories(),
  });

  const setsQuery = useQuery({
    queryKey: ['admin-sets'],
    queryFn: () => mockApi.listSets(),
  });

  const resetForm = () => setFormState(defaultSetState);

  const createMutation = useMutation({
    mutationFn: (payload: SetFormState) =>
      mockApi.createSet({
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        coverImageUrl: payload.coverImageUrl,
        isPaid: payload.isPaid,
        priceCents: payload.priceCents,
        isActive: payload.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-library'] });
      toast({ title: 'Набор создан', description: 'Новый набор добавлен в каталог.' });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось создать набор', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: SetFormState) =>
      mockApi.updateSet(payload.id!, {
        title: payload.title,
        description: payload.description,
        categoryId: payload.categoryId,
        coverImageUrl: payload.coverImageUrl,
        isPaid: payload.isPaid,
        priceCents: payload.priceCents,
        isActive: payload.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-library'] });
      toast({ title: 'Набор обновлён', description: 'Изменения сохранены.' });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось обновить набор', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mockApi.deleteSet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overlays'] });
      queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-library'] });
      toast({ title: 'Набор удалён', description: 'Все связанные оверлеи также удалены.' });
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось удалить набор', variant: 'destructive' });
    },
  });

  const handleEdit = (set: OverlaySetSummary) => {
    setFormState({
      id: set.id,
      title: set.title,
      description: set.description,
      categoryId: set.categoryId,
      coverImageUrl: set.coverImageUrl,
      isPaid: set.isPaid,
      priceCents: set.priceCents,
      isActive: set.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = (set: OverlaySetSummary) => {
    if (confirm(`Удалить набор «${set.title}» вместе с его оверлеями?`)) {
      deleteMutation.mutate(set.id);
    }
  };

  const submitHandler = (event: React.FormEvent) => {
    event.preventDefault();
    if (formState.id) {
      updateMutation.mutate(formState);
    } else {
      createMutation.mutate(formState);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const sortedSets = useMemo(() => setsQuery.data ?? [], [setsQuery.data]);
  const categoriesMap = useMemo(() => {
    const map = new Map<string, CatalogCategory>();
    categoriesQuery.data?.forEach((category) => map.set(category.id, category));
    return map;
  }, [categoriesQuery.data]);

  const dialogTitle = formState.id ? 'Редактировать набор' : 'Создать набор';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Наборы оверлеев</h2>
          <p className="text-sm text-muted-foreground">Управляйте контентом, монетизацией и доступностью наборов.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormState(defaultSetState)}>Создать набор</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>Заполните основные данные набора. Изображение обложки опционально.</DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={submitHandler}>
              <div className="space-y-2">
                <Label htmlFor="set-title">Название</Label>
                <Input
                  id="set-title"
                  required
                  value={formState.title}
                  onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-description">Описание</Label>
                <Textarea
                  id="set-description"
                  value={formState.description}
                  rows={3}
                  onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Рубрика</Label>
                <Select
                  value={formState.categoryId ?? 'none'}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, categoryId: value === 'none' ? undefined : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Не выбрана" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без рубрики</SelectItem>
                    {categoriesQuery.data?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="set-cover">URL обложки</Label>
                <Input
                  id="set-cover"
                  placeholder="https://..."
                  value={formState.coverImageUrl}
                  onChange={(event) => setFormState((prev) => ({ ...prev, coverImageUrl: event.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Платный набор</Label>
                      <p className="text-xs text-muted-foreground">Включите, если набор продаётся по цене.</p>
                    </div>
                    <Switch
                      checked={formState.isPaid}
                      onCheckedChange={(checked) =>
                        setFormState((prev) => ({ ...prev, isPaid: checked, priceCents: checked ? prev.priceCents ?? 990 : undefined }))
                      }
                    />
                  </div>
                  {formState.isPaid && (
                    <div className="space-y-1 pt-2">
                      <Label htmlFor="set-price">Цена, ₽</Label>
                      <Input
                        id="set-price"
                        type="number"
                        min={0}
                        step={10}
                        value={formState.priceCents ? formState.priceCents / 100 : ''}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, priceCents: Math.round(Number(event.target.value || 0) * 100) }))
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2 rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Активен</Label>
                      <p className="text-xs text-muted-foreground">Неактивные наборы скрыты из каталога.</p>
                    </div>
                    <Switch
                      checked={formState.isActive}
                      onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Сохранить
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-background/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Набор</TableHead>
              <TableHead className="hidden md:table-cell">Рубрика</TableHead>
              <TableHead className="hidden lg:table-cell">Модель монетизации</TableHead>
              <TableHead className="hidden lg:table-cell">Статус</TableHead>
              <TableHead className="w-32 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {setsQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  Загружаем наборы...
                </TableCell>
              </TableRow>
            )}
            {sortedSets.length === 0 && !setsQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  Наборы ещё не созданы.
                </TableCell>
              </TableRow>
            )}
            {sortedSets.map((set) => {
              const category = set.categoryId ? categoriesMap.get(set.categoryId) : undefined;
              return (
                <TableRow key={set.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={set.coverImageUrl} alt={set.title} />
                        <AvatarFallback>{set.title.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{set.title}</div>
                        {set.description && (
                          <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">{set.description}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {category ? <Badge variant="outline">{category.name}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {set.isPaid ? `Разовая покупка · ${(set.priceCents ?? 0) / 100} ₽` : 'Бесплатно'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {set.isActive ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600">Активен</Badge>
                    ) : (
                      <Badge variant="outline">Скрыт</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(set)}>
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(set)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSets;
