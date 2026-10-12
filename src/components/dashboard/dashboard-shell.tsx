"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { LoginForm } from "@/components/auth/login-form";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  // Enable keyboard shortcuts when authenticated
  useKeyboardShortcuts();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/15 text-xl text-cyan-300 animate-pulse">
            ◈
          </span>
          <p className="mt-4 text-sm text-[var(--muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-6 py-8 pt-20 lg:px-10 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
