"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DashboardHome() {
  const { profile } = useAuth();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-lg border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-purple-400/10 p-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.displayName || "there"}
        </h1>
        <p className="text-gray-400 mb-6">
          Ready to optimize your product rankings with data-driven decisions
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard/topsis/run">
            <Button size="lg">
              🎯 Rank Products Now
            </Button>
          </Link>
          <Link href="/dashboard/experiments">
            <Button variant="secondary" size="lg">
              🧪 View Experiments
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/topsis/run">
            <Card className="p-6 hover:border-cyan-400/30 transition-colors cursor-pointer">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">New Ranking</h3>
              <p className="text-sm text-gray-400 mb-4">
                Run TOPSIS analysis on your products
              </p>
              <span className="text-cyan-400 text-sm">Start →</span>
            </Card>
          </Link>

          <Link href="/dashboard/experiments/new">
            <Card className="p-6 hover:border-cyan-400/30 transition-colors cursor-pointer">
              <div className="text-3xl mb-3">🧪</div>
              <h3 className="font-semibold mb-2">Create Experiment</h3>
              <p className="text-sm text-gray-400 mb-4">
                A/B test your ranking strategies
              </p>
              <span className="text-cyan-400 text-sm">Create →</span>
            </Card>
          </Link>

          <Link href="/dashboard/connectors">
            <Card className="p-6 hover:border-cyan-400/30 transition-colors cursor-pointer">
              <div className="text-3xl mb-3">🔌</div>
              <h3 className="font-semibold mb-2">Connect Data</h3>
              <p className="text-sm text-gray-400 mb-4">
                Sync from Shopify, GA4, or upload CSV
              </p>
              <span className="text-cyan-400 text-sm">Connect →</span>
            </Card>
          </Link>
        </div>
      </div>

      {/* Status Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <h3 className="font-semibold">Data Fresh</h3>
            </div>
            <p className="text-2xl font-bold text-green-400 mb-1">All synced</p>
            <p className="text-sm text-gray-400">Last sync: 15 min ago</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="font-semibold">Experiments</h3>
            </div>
            <p className="text-2xl font-bold text-blue-400 mb-1">2 running</p>
            <p className="text-sm text-gray-400">1 completed today</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <h3 className="font-semibold">Pending</h3>
            </div>
            <p className="text-2xl font-bold text-yellow-400 mb-1">1 approval</p>
            <p className="text-sm text-gray-400">
              <Link href="/dashboard/weights" className="hover:underline">
                Review now →
              </Link>
            </p>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="font-medium">Experiment &quot;Homepage Ranking&quot; completed</p>
                <p className="text-sm text-gray-400">12% conversion uplift • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="font-medium">Weight change approved</p>
                <p className="text-sm text-gray-400">Conversion Rate: 0.25 → 0.30 • 5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="font-medium">247 products synced from Shopify</p>
                <p className="text-sm text-gray-400">All signals updated • 6 hours ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Getting Started (for new users) */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <Card className="p-6 bg-gradient-to-r from-cyan-400/5 to-purple-400/5">
          <h3 className="font-semibold mb-3">New to MCDM Optimizer?</h3>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-cyan-400">1.</span>
              <span>Define your criteria (what matters for ranking)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-cyan-400">2.</span>
              <span>Connect your data source (Shopify, GA4, or CSV)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-cyan-400">3.</span>
              <span>Run TOPSIS analysis to get ranked results</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-cyan-400">4.</span>
              <span>Create experiments to test and validate</span>
            </div>
          </div>
          <Link href="/dashboard/criteria">
            <Button variant="secondary">
              Start with Criteria →
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
