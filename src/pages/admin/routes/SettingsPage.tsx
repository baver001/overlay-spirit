import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { fetchWithAuth } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

const STRIPE_KEYS: SettingKey[] = [
  "stripe.publishable_key",
  "stripe.secret_key",
  "stripe.webhook_secret",
  "stripe.account_country",
];

type SettingKey =
  | "stripe.publishable_key"
  | "stripe.secret_key"
  | "stripe.webhook_secret"
  | "stripe.account_country"
  | "catalog.max_preview"
  | "catalog.featured_sets";

interface SettingItem {
  key: SettingKey;
  value: string;
  updated_at: number;
  updated_by: string | null;
}

interface SettingsResponse {
  items: SettingItem[];
}

interface FormValues {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  accountCountry: string;
  maxPreview: number;
  featuredSets: string;
}

async function fetchSettings(): Promise<SettingsResponse> {
  const res = await fetchWithAuth("/api/admin?list=settings", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

async function upsertSetting(key: SettingKey, value: string | number) {
  const res = await fetchWithAuth("/api/admin?action=settings.upsert", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || "Failed to save setting");
  }
  return res.json();
}

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin", "settings"], queryFn: fetchSettings });

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: {
      publishableKey: "",
      secretKey: "",
      webhookSecret: "",
      accountCountry: "US",
      maxPreview: 6,
      featuredSets: "",
    },
  });

  React.useEffect(() => {
    if (!data) return;
    const map = Object.fromEntries(data.items.map((item) => [item.key, item.value])) as Record<SettingKey, string>;
    reset({
      publishableKey: map["stripe.publishable_key"] || "",
      secretKey: map["stripe.secret_key"] || "",
      webhookSecret: map["stripe.webhook_secret"] || "",
      accountCountry: map["stripe.account_country"] || "US",
      maxPreview: Number(map["catalog.max_preview"] || 6),
      featuredSets: map["catalog.featured_sets"] || "",
    });
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      await Promise.all([
        upsertSetting("stripe.publishable_key", values.publishableKey.trim()),
        upsertSetting("stripe.secret_key", values.secretKey.trim()),
        upsertSetting("stripe.webhook_secret", values.webhookSecret.trim()),
        upsertSetting("stripe.account_country", values.accountCountry.trim()),
        upsertSetting("catalog.max_preview", values.maxPreview),
        upsertSetting("catalog.featured_sets", values.featuredSets.trim()),
      ]);
    },
    onSuccess: () => {
      toast({ title: "Settings saved successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error: any) => toast({ title: "Error", description: error?.message ?? "Failed to save settings", variant: "destructive" }),
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values);
  });

  const downloadWebhookCommand = `stripe listen --forward-to https://<your-domain>/api/stripe?webhook=1`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure Stripe integration, webhooks, and catalog parameters. Data is automatically saved to D1.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stripe Account</CardTitle>
          <CardDescription>
            Configure Stripe API keys and webhook settings for payment processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Failed to load settings. Please try again.
            </div>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              <fieldset className="grid gap-4 md:grid-cols-2" disabled={mutation.isPending}>
                <div className="space-y-2">
                  <Label htmlFor="publishableKey">Publishable key</Label>
                  <Input id="publishableKey" {...register("publishableKey", { required: true })} placeholder="pk_live_..." />
                  <p className="text-xs text-muted-foreground">
                    Find in Stripe Dashboard → Developers → API Keys.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretKey">Secret key</Label>
                  <Input id="secretKey" type="password" {...register("secretKey", { required: true })} placeholder="sk_live_..." />
                  <p className="text-xs text-muted-foreground">
                    Keep the secret key secure and server-side only.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookSecret">Webhook secret</Label>
                  <Input id="webhookSecret" type="password" {...register("webhookSecret", { required: true })} placeholder="whsec_..." />
                  <p className="text-xs text-muted-foreground">
                    Get this after creating a Stripe Webhook pointing to: <code>/api/stripe?webhook=1</code>.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountCountry">Account country</Label>
                  <Input id="accountCountry" {...register("accountCountry", { required: true })} placeholder="US" />
                </div>
              </fieldset>

              <div className="space-y-3 rounded-md border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Stripe CLI Quick Start</p>
                <Textarea value={downloadWebhookCommand} readOnly rows={2} className="font-mono text-xs" />
                <p>
                  1. Install <a className="underline" href="https://stripe.com/docs/stripe-cli" target="_blank" rel="noreferrer">Stripe CLI</a>.<br />
                  2. Run the command above to listen for events locally.
                </p>
              </div>

              <fieldset className="grid gap-4 md:grid-cols-2" disabled={mutation.isPending}>
                <div className="space-y-2">
                  <Label htmlFor="maxPreview">Max preview overlays</Label>
                  <Input type="number" id="maxPreview" min={1} max={24} {...register("maxPreview", { valueAsNumber: true, min: 1, max: 24 })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="featuredSets">Featured sets (comma-separated)</Label>
                  <Input id="featuredSets" {...register("featuredSets")} placeholder="set-id-1,set-id-2" />
                </div>
              </fieldset>

              <div className="flex justify-end gap-3">
                <Button type="submit" disabled={mutation.isPending || !formState.isDirty}>
                  {mutation.isPending ? "Saving..." : "Save settings"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

