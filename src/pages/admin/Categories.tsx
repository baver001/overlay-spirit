import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockApi } from '@/lib/mockApi';
import { CatalogCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PencilLine, Trash2 } from 'lucide-react';

interface CategoryFormState {
  id?: string;
  name: string;
  slug: string;
  orderIndex: number;
}

const emptyState: CategoryFormState = { id: undefined, name: '', slug: '', orderIndex: 1 };

const AdminCategories: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<CategoryFormState>(emptyState);

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => mockApi.listCategories(),
  });

  const resetForm = () => setFormState(emptyState);

  const createMutation = useMutation({
    mutationFn: (payload: CategoryFormState) =>
      mockApi.createCategory({ name: payload.name, slug: payload.slug, orderIndex: payload.orderIndex }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-library'] });
      toast({ title: 'Категория создана', description: 'Новая рубрика добавлена в каталог.' });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось создать категорию', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CategoryFormState) =>
      mockApi.updateCategory(payload.id!, { name: payload.name, slug: payload.slug, orderIndex: payload.orderIndex }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-library'] });
      toast({ title: 'Категория обновлена', description: 'Изменения сохранены.' });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось обновить категорию', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mockApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-library'] });
      toast({ title: 'Категория удалена', description: 'Связанные наборы будут переведены в состояние «Без рубрики».' });
    },
    onError: (error: unknown) => {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось удалить категорию', variant: 'destructive' });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleEdit = (category: CatalogCategory) => {
    setFormState({ id: category.id, name: category.name, slug: category.slug, orderIndex: category.orderIndex });
    setDialogOpen(true);
  };

  const handleDelete = (category: CatalogCategory) => {
    if (confirm(`Удалить рубрику «${category.name}»? Связанные наборы останутся без категории.`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const dialogTitle = formState.id ? 'Редактировать рубрику' : 'Создать рубрику';

  const sortedCategories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Рубрики оверлеев</h2>
          <p className="text-sm text-muted-foreground">
            Используйте рубрики, чтобы группировать наборы и облегчать поиск пользователям.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormState(emptyState)}>Добавить рубрику</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>Slug используется в URL и должен быть уникальным.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (formState.id) {
                  updateMutation.mutate(formState);
                } else {
                  createMutation.mutate(formState);
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="category-name">Название</Label>
                <Input
                  id="category-name"
                  required
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-slug">Slug</Label>
                <Input
                  id="category-slug"
                  required
                  value={formState.slug}
                  onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-order">Порядок</Label>
                <Input
                  id="category-order"
                  type="number"
                  min={0}
                  value={formState.orderIndex}
                  onChange={(event) => setFormState((prev) => ({ ...prev, orderIndex: Number(event.target.value) }))}
                />
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
              <TableHead>Название</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-24 text-center">Порядок</TableHead>
              <TableHead className="hidden w-48 md:table-cell">Обновлено</TableHead>
              <TableHead className="w-32 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoriesQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  Загружаем рубрики...
                </TableCell>
              </TableRow>
            )}
            {sortedCategories.length === 0 && !categoriesQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  Рубрики ещё не созданы.
                </TableCell>
              </TableRow>
            )}
            {sortedCategories.map((category) => (
              <TableRow key={category.id} className="hover:bg-muted/40">
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{category.slug}</Badge>
                </TableCell>
                <TableCell className="text-center">{category.orderIndex}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {new Date(category.updatedAt).toLocaleString('ru-RU')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                      <PencilLine className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category)}
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
    </div>
  );
};

export default AdminCategories;
