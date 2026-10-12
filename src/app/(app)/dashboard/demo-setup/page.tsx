"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { seedDemoData, DEMO_PRODUCTS } from "@/lib/demo/seed-data";

export default function DemoSetupPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [seeded, setSeeded] = useState(false);

  async function handleSeedData() {
    setLoading(true);
    setStatus("Seeding demo data...");

    try {
      const result = await seedDemoData();
      
      if (result.success) {
        setStatus("✅ Demo data seeded successfully!");
        setSeeded(true);
      } else {
        setStatus("❌ Failed to seed data. Check console for errors.");
      }
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Demo Setup</h1>
        <p className="text-gray-400">
          Seed the application with sample data for demos and testing
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Demo Setup</h2>
        <p className="text-gray-400 mb-6">
          This will populate your app with:
        </p>
        
        <ul className="space-y-2 mb-6 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-cyan-400">✓</span>
            <span>5 pre-configured criteria (Conversion Rate, Revenue, Rating, Inventory, Return Rate)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-cyan-400">✓</span>
            <span>1 default TOPSIS policy (Vector normalization)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-cyan-400">✓</span>
            <span>1 completed experiment showing 12% conversion uplift</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-cyan-400">✓</span>
            <span>10 sample products with realistic scores</span>
          </li>
        </ul>

        <Button
          onClick={handleSeedData}
          disabled={loading || seeded}
          size="lg"
        >
          {loading ? "Seeding..." : seeded ? "✓ Data Seeded" : "🌱 Seed Demo Data"}
        </Button>

        {status && (
          <div className={`mt-4 p-4 rounded-lg ${
            status.includes("✅") 
              ? "bg-green-500/10 text-green-400" 
              : status.includes("❌")
              ? "bg-red-500/10 text-red-400"
              : "bg-blue-500/10 text-blue-400"
          }`}>
            {status}
          </div>
        )}

        {seeded && (
          <div className="mt-6 p-4 bg-cyan-500/10 rounded-lg">
            <h3 className="font-semibold mb-2">Next Steps:</h3>
            <ol className="space-y-2 text-sm">
              <li>1. Go to <Link href="/dashboard" className="text-cyan-400 hover:underline">Home Dashboard</Link></li>
              <li>2. Click &quot;Rank Products Now&quot;</li>
              <li>3. Use the sample products below for your demo</li>
              <li>4. View the completed experiment in <Link href="/dashboard/experiments" className="text-cyan-400 hover:underline">Experiments</Link></li>
            </ol>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sample Products</h2>
        <p className="text-gray-400 mb-4 text-sm">
          Use these products when running TOPSIS analysis:
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-3">Product</th>
                <th className="text-right py-2 px-3">Conv. Rate</th>
                <th className="text-right py-2 px-3">RPV</th>
                <th className="text-right py-2 px-3">Rating</th>
                <th className="text-right py-2 px-3">Inventory</th>
                <th className="text-right py-2 px-3">Return %</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_PRODUCTS.map((product) => (
                <tr key={product.id} className="border-b border-gray-800">
                  <td className="py-2 px-3">{product.name}</td>
                  <td className="text-right py-2 px-3">{product.conversionRate}%</td>
                  <td className="text-right py-2 px-3">${product.revenuePerVisitor}</td>
                  <td className="text-right py-2 px-3">{product.customerRating}★</td>
                  <td className="text-right py-2 px-3">{product.inventoryLevel}</td>
                  <td className="text-right py-2 px-3">{product.returnRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-blue-500/10 rounded-lg text-sm">
          <p className="font-semibold mb-2">💡 Demo Tip:</p>
          <p className="text-gray-400">
            Copy this table to show stakeholders the input data, then show how TOPSIS ranks them based on multiple criteria.
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-amber-500/10">
        <h3 className="font-semibold mb-2">⚠️ Important Notes</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li>• This will overwrite existing criteria and policies</li>
          <li>• The experiment data is fake but realistic</li>
          <li>• You can run this multiple times to reset demo data</li>
          <li>• For production, use real data from Shopify/GA4</li>
        </ul>
      </Card>
    </div>
  );
}
