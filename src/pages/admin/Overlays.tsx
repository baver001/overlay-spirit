import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/mockApi';
import { OverlayAsset, OverlaySetSummary } from '@/lib/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OverlayFormState {
  id?: string;
  setId: string;
  kind: 'css' | 'image';
  value: string;
  aspectRatio?: number;
  orderIndex?: number;
  isActive: boolean;
}

const defaultOverlayState: OverlayFormState = {
  id: undefined,
  setId: '',
  kind: 'image',
  value: '',
  aspectRatio: undefined,
  orderIndex: undefined,
  isActive: true,
};

const AdminOverlays: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<OverlayFormState>(defaultOverlayState);
  const [activeSetId, setActiveSetId] = useState<string | undefined>(undefined);

  const setsQuery = useQuery({
    queryKey: ['admin-sets'],
    queryFn: () => mockApi.listSets(),
  });

  useEffect(() => {
    if (!activeSetId && setsQuery.data && setsQuery.data.length > 0) {
      setActiveSetId(setsQuery.data[0].id);
    }
  }, [activeSetId, setsQuery.data]);

  const overlaysQuery = useQuery({
    queryKey: ['admin-overlays', activeSetId],
    queryFn: () => (activeSetId ? mockApi.listOverlays(activeSetId) : Promise.resolve([])),
    enabled: Boolean(activeSetId),
  });

  const resetForm = () => setFormState((prev) => ({ ...defaultOverlayState, setId: activeSetId ?? '' }));

  const createMutation = useMutation({
    mutationFn: (payload: OverlayFormState) =>
      mockApi.createOverlay({
        setId: payload.setId,
        kind: payload.kind,
        value: payload.value,
        aspectRatio: payload.aspectRatio,
        orderIndex: payload.orderIndex,
        isActive: payload.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-overlays', activeSetId] });
      queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-library'] });
      toast({ title: 'Оверлей создан', description: 'Ассет добавлен в набор.' });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось создать оверлей', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: OverlayFormState) =>
      mockApi.updateOverlay(payload.id!, {
        kind: payload.kind,
        value: payload.value,
        aspectRatio: payload.aspectRatio,
        orderIndex: payload.orderIndex,
        isActive: payload.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-overlays', activeSetId] });
      queryClient.invalidateQueries({ queryKey: ['catalog-library'] });
      toast({ title: 'Оверлей обновлён', description: 'Изменения сохранены.' });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось обновить оверлей', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mockApi.deleteOverlay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-overlays', activeSetId] });
      queryClient.invalidateQueries({ queryKey: ['admin-summary'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-library'] });
      toast({ title: 'Оверлей удалён', description: 'Ассет убран из набора.' });
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось удалить оверлей', variant: 'destructive' });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleEdit = (overlay: OverlayAsset) => {
    setFormState({
      id: overlay.id,
      setId: overlay.setId,
      kind: overlay.kind,
      value: overlay.value,
      aspectRatio: overlay.aspectRatio,
      orderIndex: overlay.orderIndex,
      isActive: overlay.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = (overlay: OverlayAsset) => {
    if (confirm('Удалить выбранный оверлей?')) {
      deleteMutation.mutate(overlay.id);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeSetId) return;
    const payload = { ...formState, setId: activeSetId };
    if (payload.id) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const currentSet: OverlaySetSummary | undefined = useMemo(
    () => setsQuery.data?.find((set) => set.id === activeSetId),
    [activeSetId, setsQuery.data]
  );

  const dialogTitle = formState.id ? 'Редактировать оверлей' : 'Добавить оверлей';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Оверлеи в наборе</h2>
          <p className="text-sm text-muted-foreground">
            Управляйте ассетами внутри выбранного набора, задавайте порядок отображения и активность.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={activeSetId ?? ''}
            onValueChange={(value) => {
              setActiveSetId(value);
              setFormState((prev) => ({ ...prev, setId: value }));
            }}
          >
            <SelectTrigger className="min-w-[220px]">
              <SelectValue placeholder="Выберите набор" />
            </SelectTrigger>
            <SelectContent>
              {setsQuery.data?.map((set) => (
                <SelectItem key={set.id} value={set.id}>
                  {set.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button disabled={!activeSetId} onClick={() => resetForm()}>
                Добавить оверлей
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dialogTitle}</DialogTitle>
                <DialogDescription>
                  Оверлей сохраняется локально. Для типа «CSS» можно указать градиент или однотонный цвет.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label>Тип оверлея</Label>
                  <Select
                    value={formState.kind}
                    onValueChange={(value: 'css' | 'image') => setFormState((prev) => ({ ...prev, kind: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Изображение</SelectItem>
                      <SelectItem value="css">CSS-градиент</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overlay-value">Значение</Label>
                  <Textarea
                    id="overlay-value"
                    rows={3}
                    required
                    value={formState.value}
                    onChange={(event) => setFormState((prev) => ({ ...prev, value: event.target.value }))}
                    placeholder={formState.kind === 'image' ? 'https://...' : 'linear-gradient(...)'}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="overlay-order">Порядок</Label>
                    <Input
                      id="overlay-order"
                      type="number"
                      min={1}
                      value={formState.orderIndex ?? ''}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, orderIndex: Number(event.target.value || 0) }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overlay-aspect">Аспект (если известен)</Label>
                    <Input
                      id="overlay-aspect"
                      type="number"
                      step={0.01}
                      min={0}
                      value={formState.aspectRatio ?? ''}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, aspectRatio: event.target.value ? Number(event.target.value) : undefined }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <Label className="text-sm font-medium">Активен</Label>
                    <p className="text-xs text-muted-foreground">Отключенные оверлеи скрыты из набора.</p>
                  </div>
                  <Switch
                    checked={formState.isActive}
                    onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting || !activeSetId}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Сохранить
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {currentSet ? (
        <div className="rounded-xl border border-border bg-background/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ассет</TableHead>
                <TableHead className="hidden md:table-cell">Порядок</TableHead>
                <TableHead className="hidden md:table-cell">Статус</TableHead>
                <TableHead className="w-32 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overlaysQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    Загружаем оверлеи...
                  </TableCell>
                </TableRow>
              )}
              {(!overlaysQuery.data || overlaysQuery.data.length === 0) && !overlaysQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    В наборе пока нет оверлеев. Добавьте первый элемент.
                  </TableCell>
                </TableRow>
              )}
              {overlaysQuery.data?.map((overlay) => (
                <TableRow key={overlay.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-md border border-border">
                        {overlay.kind === 'image' ? (
                          <img
                            src={overlay.value}
                            alt="preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full" style={{ backgroundImage: overlay.value }} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{overlay.kind === 'image' ? 'Image' : 'CSS'}</Badge>
                          {overlay.aspectRatio && (
                            <span className="text-xs text-muted-foreground">AR: {overlay.aspectRatio.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-1 max-w-md">{overlay.value}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{overlay.orderIndex}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {overlay.isActive ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600">Активен</Badge>
                    ) : (
                      <Badge variant="outline">Выключен</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(overlay)}>
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(overlay)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Сначала создайте и выберите набор, чтобы работать с оверлеями.
        </div>
      )}
    </div>
  );
};

export default AdminOverlays;
