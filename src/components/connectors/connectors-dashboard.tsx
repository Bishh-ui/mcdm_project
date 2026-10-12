"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SyncResult {
  shop: string;
  syncedAt: string;
  summary: {
    products: number;
    orders: number;
    locations: number;
    signals: number;
  };
  signals: Array<{
    productId: number;
    name: string;
    totalRevenue: number;
    totalUnitsSold: number;
    orderCount: number;
    totalInventory: number;
    imageCount: number;
  }>;
}

export function ConnectorsDashboard() {
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if Shopify is connected (cookie-based)
  const checkConnection = async () => {
    try {
      const res = await fetch("/api/shopify/products?limit=1");
      if (res.ok) {
        setShopifyConnected(true);
        return true;
      }
    } catch {
      // not connected
    }
    return false;
  };

  const connectShopify = () => {
    const shop = prompt("Enter your Shopify store domain (e.g. my-store.myshopify.com):");
    if (!shop) return;
    window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(shop)}`;
  };

  const runSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/shopify/sync", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Sync failed");
      }
      const data = await res.json();
      setSyncResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Check on mount
  useState(() => {
    checkConnection();
  });

  return (
    <div className="space-y-6">
      {/* Shopify Connector */}
      <Card>
        <CardHeader
          tag="Shopify"
          tagColor="text-lime-200/90"
          title="Shopify Store Connector"
          description="Connect your Shopify store to sync products, orders, and inventory data"
          actions={
            shopifyConnected ? (
              <Badge variant="lime">Connected</Badge>
            ) : (
              <Button size="sm" onClick={connectShopify}>
                Connect Store
              </Button>
            )
          }
        />

        {shopifyConnected && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button onClick={runSync} disabled={syncing}>
                {syncing ? "Syncing…" : "Sync Now"}
              </Button>
            </div>
          </div>
        )}

        {!shopifyConnected && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-[var(--muted)]">
              Click &quot;Connect Store&quot; to authorize the MCDM Optimizer to read your
              Shopify product catalog, orders, and inventory. We only request read
              permissions — no data is modified in your store.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["read_products", "read_orders", "read_inventory", "read_analytics", "read_customers", "read_locations"].map((scope) => (
                <Badge key={scope} variant="neutral">{scope}</Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {error && (
        <Card className="border-red-400/30">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {/* Sync Results */}
      {syncResult && (
        <>
          <Card>
            <CardHeader
              tag="Sync Complete"
              tagColor="text-lime-200/90"
              title="Data Summary"
              description={`Synced from ${syncResult.shop} at ${new Date(syncResult.syncedAt).toLocaleString()}`}
            />
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Products", value: syncResult.summary.products, color: "text-cyan-300" },
                { label: "Orders", value: syncResult.summary.orders, color: "text-lime-300" },
                { label: "Locations", value: syncResult.summary.locations, color: "text-amber-300" },
                { label: "Signals", value: syncResult.summary.signals, color: "text-purple-300" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                  <p className={`text-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Product signals table */}
          <Card>
            <CardHeader
              tag="Product Signals"
              title="Computed Criteria Signals"
              description="These signals can be mapped to TOPSIS criteria for automated scoring"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2 text-left text-[var(--muted)]">Product</th>
                    <th className="px-3 py-2 text-right text-[var(--muted)]">Revenue</th>
                    <th className="px-3 py-2 text-right text-[var(--muted)]">Units Sold</th>
                    <th className="px-3 py-2 text-right text-[var(--muted)]">Orders</th>
                    <th className="px-3 py-2 text-right text-[var(--muted)]">Inventory</th>
                    <th className="px-3 py-2 text-right text-[var(--muted)]">Images</th>
                  </tr>
                </thead>
                <tbody>
                  {syncResult.signals.slice(0, 20).map((signal) => (
                    <tr key={signal.productId} className="border-b border-white/5">
                      <td className="px-3 py-2 font-medium text-white">{signal.name}</td>
                      <td className="px-3 py-2 text-right font-mono text-lime-300">
                        ${signal.totalRevenue.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-white/80">
                        {signal.totalUnitsSold}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-white/80">
                        {signal.orderCount}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-white/80">
                        {signal.totalInventory}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-white/80">
                        {signal.imageCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* GA4 Connector */}
      <Card>
        <CardHeader
          tag="Google Analytics 4"
          tagColor="text-amber-200/90"
          title="GA4 via BigQuery"
          description="Query e-commerce events, product performance, and conversion funnels from your GA4 BigQuery export"
          actions={<Badge variant="lime">Configured</Badge>}
        />
        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
              <span>Property: <span className="text-white">{process.env.NEXT_PUBLIC_GA4_PROPERTY_ID ?? "415108382"}</span></span>
              <span>Project: <span className="text-white">abm-agent</span></span>
              <span>Dataset: <span className="text-white">mcdm_events</span></span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  const res = await fetch("/api/ga4/events?days=30");
                  const data = await res.json();
                  alert(`GA4 Events (30d): ${JSON.stringify(data.events?.length ?? 0)} event types found`);
                } catch {
                  alert("GA4 query failed — check BigQuery access");
                }
              }}
            >
              Test Events Query
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  const res = await fetch("/api/ga4/products?days=30");
                  const data = await res.json();
                  alert(`GA4 Products: ${data.count ?? 0} products with performance data`);
                } catch {
                  alert("GA4 query failed — check BigQuery access");
                }
              }}
            >
              Test Product Performance
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                try {
                  const res = await fetch("/api/ga4/funnel?days=30");
                  const data = await res.json();
                  alert(`Funnel: ${data.funnel?.length ?? 0} steps`);
                } catch {
                  alert("GA4 query failed — check BigQuery access");
                }
              }}
            >
              Test Funnel
            </Button>
          </div>
        </div>
      </Card>

      {/* WooCommerce — future */}
      <Card className="opacity-50">
        <CardHeader
          tag="WooCommerce"
          tagColor="text-purple-200/90"
          title="WooCommerce Connector"
          description="REST API v3 integration — available when needed"
        />
        <Badge variant="neutral">Future Phase</Badge>
      </Card>
    </div>
  );
}
