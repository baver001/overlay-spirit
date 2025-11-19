import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { PlusCircle, Pencil, Trash2, Upload, X } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface SetItem {
  id: string;
  title: string;
  category_id: string | null;
  is_paid: number;
  price_cents: number | null;
  discount_price_cents: number | null;
  is_active: number;
  updated_at: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SetFormValues {
  id?: string;
  title: string;
  category_id: string;
  is_paid: boolean;
  price_dollars: number;
  discount_price_dollars: number;
  is_active: boolean;
}

interface UploadedImage {
  file: File;
  preview: string;
  key?: string;
}

const EMPTY_FORM: SetFormValues = {
  title: "",
  category_id: "",
  is_paid: false,
  price_dollars: 0,
  discount_price_dollars: 0,
  is_active: true,
};

export const SetsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SetItem | null>(null);
  const [uploadedImages, setUploadedImages] = React.useState<UploadedImage[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const setsQuery = useQuery<{ items: SetItem[]; meta: { total: number } }>({
    queryKey: ["admin", "sets"],
    queryFn: async () => {
      const res = await fetch(`/api/admin?list=sets&limit=200`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load sets");
      return res.json();
    },
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery<{ items: Category[] }>({
    queryKey: ["admin", "categories", "list"],
    queryFn: async () => {
      const res = await fetch(`/api/admin?list=categories&with_counts=0`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
    staleTime: 60_000,
  });

  const form = useForm<SetFormValues>({ defaultValues: EMPTY_FORM });

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadedKeys: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const resp = await fetch(`/api/admin?action=file.upload`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!resp.ok) {
          const json = await resp.json().catch(() => ({}));
          throw new Error(json.error || "Failed to upload image");
        }
        const data = await resp.json();
        uploadedKeys.push(data.key);
      }
      return uploadedKeys;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: SetFormValues & { overlay_keys: string[] }) => {
      const action = values.id ? "set.update" : "set.create";
      
      // Safely parse numbers
      const priceDollars = Number(values.price_dollars) || 0;
      const discountDollars = Number(values.discount_price_dollars) || 0;
      
      const payload: any = {
        id: values.id,
        title: values.title,
        category_id: values.category_id && values.category_id.trim() !== "" ? values.category_id : null,
        is_paid: values.is_paid,
        is_active: values.is_active,
        overlays: values.overlay_keys.map((key, index) => ({
          kind: "image" as const,
          value: key,
          order_index: index,
          is_active: true,
        })),
      };

      // Add price fields only if set is paid
      if (values.is_paid) {
        payload.price_cents = Math.round(priceDollars * 100);
        if (discountDollars > 0) {
          payload.discount_price_cents = Math.round(discountDollars * 100);
        }
      }
      
      console.log('[SetsPage] Sending payload:', JSON.stringify(payload, null, 2));
      
      const resp = await fetch(`/api/admin?action=${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        console.error('[SetsPage] Server error:', json);

        // Handle validation errors with details
        if (json.error === "Validation failed" && json.issues) {
          const issues = json.issues;
          const errorMessages = Object.entries(issues).map(([field, errors]) => {
            if (Array.isArray(errors)) {
              return `${field}: ${errors.join(', ')}`;
            }
            if (errors && typeof errors === 'object') {
              const subErrors = Object.entries(errors).map(([subField, subError]) => {
                if (Array.isArray(subError)) {
                  return `${subField}: ${subError.join(', ')}`;
                }
                return `${subField}: ${String(subError)}`;
              });
              return `${field}: ${subErrors.join(', ')}`;
            }
            return `${field}: ${String(errors)}`;
          });
          throw new Error(`Validation failed:\n${errorMessages.join('\n')}`);
        }

        throw new Error(json.error || "Failed to save set");
      }
      return resp.json();
    },
    onSuccess: async () => {
      toast({ title: "Set saved successfully" });
      // Invalidate and refetch to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "sets"] }),
        queryClient.invalidateQueries({ queryKey: ["overlay-catalog"] }),
      ]);
      // Force refetch catalog to update preview overlays immediately
      await queryClient.refetchQueries({ queryKey: ["overlay-catalog"] });
      setDialogOpen(false);
      form.reset(EMPTY_FORM);
      setUploadedImages([]);
    },
    onError: (error: any) => toast({ title: "Error", description: error?.message ?? "Failed to save", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (setItem: SetItem) => {
      const resp = await fetch(`/api/admin?action=set.delete`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: setItem.id }),
      });
      if (!resp.ok) {
        const json = await resp.json().catch(() => ({}));
        throw new Error(json.error || "Failed to delete set");
      }
      return resp.json();
    },
    onSuccess: async () => {
      toast({ title: "Set deleted" });
      // Invalidate and refetch to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "sets"] }),
        queryClient.invalidateQueries({ queryKey: ["overlay-catalog"] }),
      ]);
      // Force refetch catalog to update preview overlays immediately
      await queryClient.refetchQueries({ queryKey: ["overlay-catalog"] });
      setDeleteTarget(null);
    },
    onError: (error: any) => toast({ title: "Error", description: error?.message ?? "Failed to delete", variant: "destructive" }),
  });

  const openCreate = () => {
    form.reset(EMPTY_FORM);
    setUploadedImages([]);
    setDialogOpen(true);
  };

  const openEdit = async (setItem: SetItem) => {
    form.reset({
      id: setItem.id,
      title: setItem.title,
      category_id: setItem.category_id || "",
      is_paid: Boolean(setItem.is_paid),
      price_dollars: setItem.price_cents ? setItem.price_cents / 100 : 0,
      discount_price_dollars: setItem.discount_price_cents ? setItem.discount_price_cents / 100 : 0,
      is_active: Boolean(setItem.is_active),
    });

    // Load existing overlays using admin API
    try {
      const overlaysResp = await fetch(`/api/admin?action=set.get_overlays`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ set_id: setItem.id }),
      });

      if (overlaysResp.ok) {
        const overlaysJson = await overlaysResp.json();
        const overlays = (overlaysJson.items || []).filter((o: any) => o.kind === "image");
        console.log('[SetsPage] Loaded overlays for edit:', overlays);

        setUploadedImages(
          overlays.map((o: any) => ({
            file: null as any,
            preview: `/api/files/${o.value}`,
            key: o.value,
          }))
        );
      }
    } catch (error) {
      console.error('[SetsPage] Failed to load overlays for edit:', error);
      setUploadedImages([]);
    }

    setDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const jpgFiles = files.filter((f) => f.type === "image/jpeg" || f.name.toLowerCase().endsWith(".jpg"));
    if (jpgFiles.length !== files.length) {
      toast({ title: "Warning", description: "Only JPG files are allowed", variant: "destructive" });
    }
    const newImages: UploadedImage[] = jpgFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      const updated = [...prev];
      if (updated[index].preview.startsWith("blob:")) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // First, upload new images
      const filesToUpload = uploadedImages.filter((img) => img.file).map((img) => img.file);
      const existingKeys = uploadedImages.filter((img) => img.key).map((img) => img.key!);

      let newKeys: string[] = [];
      if (filesToUpload.length > 0) {
        newKeys = await uploadImagesMutation.mutateAsync(filesToUpload);
      }

      const allKeys = [...existingKeys, ...newKeys];
      if (allKeys.length === 0) {
        toast({ title: "Error", description: "Please upload at least one overlay image", variant: "destructive" });
        return;
      }

      // Then create/update set with overlays
      await upsertMutation.mutateAsync({ ...values, overlay_keys: allKeys });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message ?? "Failed to save set", variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Overlay Sets</h1>
          <p className="text-sm text-muted-foreground">Create and manage overlay collections.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusCircle className="h-4 w-4" />
          Add set
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Set Catalog</CardTitle>
          <CardDescription>All overlay sets in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {setsQuery.isLoading ? (
            <Skeleton className="h-48" />
          ) : setsQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to load sets.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Price</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Updated</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setsQuery.data?.items.map((set) => (
                  <TableRow key={set.id}>
                    <TableCell className="font-medium">{set.title}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {set.is_paid ? <Badge variant="default">Paid</Badge> : <Badge variant="secondary">Free</Badge>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {set.is_paid ? (
                        <div className="flex items-center gap-2">
                          {set.discount_price_cents && (
                            <>
                              <span className="text-muted-foreground line-through">${(set.price_cents! / 100).toFixed(2)}</span>
                              <span className="font-semibold text-primary">${(set.discount_price_cents / 100).toFixed(2)}</span>
                            </>
                          )}
                          {!set.discount_price_cents && <span>${(set.price_cents! / 100).toFixed(2)}</span>}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {set.is_active ? <Badge variant="outline">Active</Badge> : <Badge variant="destructive">Hidden</Badge>}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">{new Date(set.updated_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Edit" onClick={() => openEdit(set)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          aria-label="Delete"
                          onClick={() => setDeleteTarget(set)}
                          disabled={deleteMutation.isPending && deleteTarget?.id === set.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.getValues("id") ? "Edit Set" : "New Set"}</DialogTitle>
            <DialogDescription>Configure set properties and upload overlay images (JPG only)</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={onSubmit}>
            <input type="hidden" {...form.register("id")} />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="set-title">Title *</Label>
                <Input id="set-title" {...form.register("title", { required: true })} placeholder="Neon Dreams" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="set-category">Category *</Label>
                <Select value={form.watch("category_id")} onValueChange={(val) => form.setValue("category_id", val)}>
                  <SelectTrigger id="set-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesQuery.data?.items.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Switch checked={form.watch("is_paid") || false} onCheckedChange={(checked) => form.setValue("is_paid", checked)} />
                  Paid set
                </Label>
              </div>

              {form.watch("is_paid") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="12.00"
                      {...form.register("price_dollars", { valueAsNumber: true, required: form.watch("is_paid") })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount-price">Discount price (USD)</Label>
                    <Input
                      id="discount-price"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="4.95"
                      {...form.register("discount_price_dollars", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty for no discount</p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Switch checked={form.watch("is_active") ?? true} onCheckedChange={(checked) => form.setValue("is_active", checked)} />
                  Active
                </Label>
              </div>
            </div>

            <div className="space-y-3 rounded-md border border-dashed border-border/60 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Overlay Images (JPG)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadImagesMutation.isPending}
                >
                  <Upload className="h-4 w-4" /> Upload Images
                </Button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,.jpg" multiple className="hidden" onChange={handleFileSelect} />
              </div>

              {uploadedImages.length === 0 ? (
                <p className="text-xs text-muted-foreground">Upload at least one JPG image to create the set.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group rounded-md border border-border overflow-hidden">
                      <img src={img.preview} alt={`Overlay ${index + 1}`} className="w-full aspect-square object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1">#{index + 1}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending || uploadImagesMutation.isPending}>
                {upsertMutation.isPending || uploadImagesMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete set</DialogTitle>
            <DialogDescription>Set "{deleteTarget?.title}" will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
