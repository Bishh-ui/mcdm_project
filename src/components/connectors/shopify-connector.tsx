"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEMO_PRODUCTS } from "@/lib/demo/seed-data";

export function ShopifyConnector() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(() => new Date(Date.now() - 1000 * 60 * 15)); // 15 min ago
  const [products] = useState(DEMO_PRODUCTS);
  const [minutesAgo, setMinutesAgo] = useState(15);

  const handleSync = async () => {
    setSyncing(true);
    // Simulate sync delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLastSync(new Date());
    setMinutesAgo(0);
    setSyncing(false);
  };

  const handlePushRankings = async () => {
    // Simulate pushing rankings to Shopify
    await new Promise((resolve) => setTimeout(resolve, 1500));
    alert("✅ Rankings pushed to Shopify metafields successfully!");
  };

  const storeName = "mcdm-demo-store.myshopify.com";
  const connected = true;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader
          tag="Shopify Integration"
          title="Store Connection"
          description="Sync products and push TOPSIS rankings to your Shopify store"
        />
        
        <div className="space-y-4">
          {/* Store Info */}
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-lime-500/20">
                <span className="text-2xl">🛍️</span>
              </div>
              <div>
                <p className="font-medium text-white">{storeName}</p>
                <p className="text-xs text-gray-400">
                  Last synced: {lastSync.toLocaleTimeString()} ({minutesAgo} min ago)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={connected ? "lime" : "neutral"}>
                {connected ? "Connected" : "Disconnected"}
              </Badge>
              <Button
                size="sm"
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? "Syncing..." : "🔄 Sync Now"}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-gray-400">Products Synced</p>
              <p className="mt-1 text-2xl font-bold text-white">{products.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-gray-400">TOPSIS Rankings</p>
              <p className="mt-1 text-2xl font-bold text-cyan-400">{products.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-gray-400">Avg. Score</p>
              <p className="mt-1 text-2xl font-bold text-lime-400">0.742</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Synced Products */}
      <Card>
        <CardHeader
          tag="Product Catalog"
          title="Synced Products from Shopify"
          description="Products pulled from your Shopify store with performance metrics"
          actions={
            <Button size="sm" variant="secondary" onClick={handlePushRankings}>
              📤 Push Rankings to Shopify
            </Button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Product</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Conv. Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Revenue/Visit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Rating</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Inventory</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Return %</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{product.name}</div>
                    <div className="text-xs text-gray-400">{product.id}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono ${product.conversionRate > 10 ? "text-lime-400" : "text-white/80"}`}>
                      {product.conversionRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-cyan-400">${product.revenuePerVisitor}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-white/80">{product.customerRating}★</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono ${product.inventoryLevel < 300 ? "text-amber-400" : "text-white/80"}`}>
                      {product.inventoryLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono ${product.returnRate > 5 ? "text-red-400" : "text-white/80"}`}>
                      {product.returnRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="lime">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Integration Info */}
      <Card className="bg-blue-500/10">
        <CardHeader
          tag="How It Works"
          title="Shopify ↔ TOPSIS Integration"
        />
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-cyan-400">1.</span>
            <p className="text-gray-300">
              <strong className="text-white">Sync Products:</strong> Pull product data from Shopify including inventory, pricing, and performance metrics
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400">2.</span>
            <p className="text-gray-300">
              <strong className="text-white">Run TOPSIS:</strong> Analyze products across multiple criteria (conversion, revenue, rating, inventory, returns)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400">3.</span>
            <p className="text-gray-300">
              <strong className="text-white">Push Rankings:</strong> Write TOPSIS scores to Shopify product metafields (mcdm.topsis_rank, mcdm.topsis_score)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-cyan-400">4.</span>
            <p className="text-gray-300">
              <strong className="text-white">Display Optimized:</strong> Shopify theme displays products in TOPSIS-optimized order for maximum conversions
            </p>
          </div>
        </div>
      </Card>

      {/* Metafield Preview */}
      <Card>
        <CardHeader
          tag="Technical Details"
          title="Shopify Metafields"
          description="TOPSIS rankings are stored as product metafields"
        />
        <div className="rounded-lg border border-white/10 bg-black/30 p-4 font-mono text-xs">
          <div className="text-gray-400">{`// Example metafields written to Shopify products`}</div>
          <div className="mt-2 text-white">
            {`{`}
            <div className="ml-4">
              <div className="text-cyan-400">&quot;namespace&quot;: <span className="text-lime-400">&quot;mcdm&quot;</span>,</div>
              <div className="text-cyan-400">&quot;key&quot;: <span className="text-lime-400">&quot;topsis_rank&quot;</span>,</div>
              <div className="text-cyan-400">&quot;value&quot;: <span className="text-amber-400">1</span>,</div>
              <div className="text-cyan-400">&quot;type&quot;: <span className="text-lime-400">&quot;number_integer&quot;</span></div>
            </div>
            {`}`}
          </div>
          <div className="mt-2 text-white">
            {`{`}
            <div className="ml-4">
              <div className="text-cyan-400">&quot;namespace&quot;: <span className="text-lime-400">&quot;mcdm&quot;</span>,</div>
              <div className="text-cyan-400">&quot;key&quot;: <span className="text-lime-400">&quot;topsis_score&quot;</span>,</div>
              <div className="text-cyan-400">&quot;value&quot;: <span className="text-amber-400">0.892456</span>,</div>
              <div className="text-cyan-400">&quot;type&quot;: <span className="text-lime-400">&quot;number_decimal&quot;</span></div>
            </div>
            {`}`}
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
          <strong>💡 Shopify Theme Integration:</strong> Use Liquid to sort products by metafield:
          <code className="mt-1 block rounded bg-black/30 p-2 font-mono text-[10px]">
            {`{% assign sorted_products = collection.products | sort: 'metafields.mcdm.topsis_rank' %}`}
          </code>
        </div>
      </Card>
    </div>
  );
}
