import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { fetchWithAuth } from "@/lib/api";
import { SortableItem } from "./components/SortableItem";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

interface Category {
  id: string;
  slug: string;
  name: string;
  order_index: number;
  sets_count?: number;
  created_at: number;
  updated_at: number;
}

interface CategoryFormValues {
  id?: string;
  name: string;
}

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const categoriesQuery = useQuery<{ items: Category[] }>({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/admin?list=categories`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
    staleTime: 60_000,
  });

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);
  const form = useForm<CategoryFormValues>({ defaultValues: { name: "" } });
  const isEdit = Boolean(form.watch("id"));

  const upsertMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const action = values.id ? "category.update" : "category.create";
      const resp = await fetchWithAuth(`/api/admin?action=${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to save category");
      }
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: "Category saved" });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setDialogOpen(false);
      form.reset({ name: "" });
    },
    onError: (error: any) => toast({ title: "Error", description: error?.message ?? "Failed to save category", variant: "destructive" }),
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (category: Category) => {
      const resp = await fetchWithAuth(`/api/admin?action=category.delete`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: category.id }),
      });
      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to delete category");
      }
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: "Category deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => toast({ title: "Error", description: error?.message ?? "Failed to delete category", variant: "destructive" }),
    retry: false,
  });

  const reorderMutation = useMutation({
    mutationFn: async (payload: Array<{ id: string; order_index: number }>) => {
      const resp = await fetchWithAuth(`/api/admin?action=category.reorder`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categories: payload }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reorder categories");
      }
      return resp.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: (error: any) => toast({ title: "Error", description: error?.message ?? "Failed to reorder categories", variant: "destructive" }),
  });

  const openCreate = () => {
    form.reset({ name: "" });
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    form.reset({ id: category.id, name: category.name });
    setDialogOpen(true);
  };

  const onSubmit = form.handleSubmit((values) => {
    upsertMutation.mutate(values);
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categoriesQuery.data?.items) return;
    const items = [...categoriesQuery.data.items];
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({ ...item, order_index: index }));
    queryClient.setQueryData(["admin", "categories"], { items: reordered });
    reorderMutation.mutate(reordered.map(({ id, order_index }) => ({ id, order_index }))); 
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">Manage the catalog category tree.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle className="h-4 w-4" />
          Add category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category list</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesQuery.isLoading ? (
            <Skeleton className="h-48" />
          ) : categoriesQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to load categories.
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={categoriesQuery.data?.items ?? []} strategy={verticalListSortingStrategy}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Slug</TableHead>
                      <TableHead className="hidden md:table-cell">Sets</TableHead>
                      <TableHead className="hidden lg:table-cell">Updated</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoriesQuery.data?.items.map((category) => (
                      <SortableItem key={category.id} id={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{category.slug}</TableCell>
                        <TableCell className="hidden md:table-cell">{category.sets_count ?? 0}</TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {new Date(category.updated_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Edit category"
                              onClick={() => openEdit(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              aria-label="Delete category"
                              onClick={() => setDeleteTarget(category)}
                              disabled={deleteMutation.isPending && deleteTarget?.id === category.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </SortableItem>
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>
              Enter a clear category name. Slug will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <input type="hidden" {...form.register("id")} />
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input id="category-name" {...form.register("name", { required: true })} placeholder="Minimal" autoFocus />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category</DialogTitle>
            <DialogDescription>
              Category "{deleteTarget?.name}" will lose its connections and cannot be restored.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

