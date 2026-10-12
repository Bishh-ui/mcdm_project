"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { signOut } from "@/lib/firebase/auth";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { subscribeToCollection } from "@/lib/firebase/firestore";
import { useTheme } from "@/components/theme/theme-provider";
import type { Notification } from "@/lib/notifications/types";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Home", icon: "🏠" },
      { href: "/dashboard/topsis/run", label: "Rank Products", icon: "🎯" },
      { href: "/dashboard/experiments", label: "Experiments", icon: "🧪" },
    ],
  },
  {
    title: "Setup",
    items: [
      { href: "/dashboard/criteria", label: "Criteria", icon: "◇" },
      { href: "/dashboard/connectors", label: "Shopify", icon: "🛍️" },
      { href: "/dashboard/weights", label: "Weight Governance", icon: "⚖" },
      ...(process.env.NODE_ENV === "development" 
        ? [{ href: "/dashboard/demo-setup", label: "Demo Setup", icon: "🌱" }]
        : []
      ),
    ],
  },
  {
    title: "Advanced",
    items: [
      { href: "/dashboard/topsis", label: "TOPSIS Config", icon: "⬡" },
      { href: "/dashboard/weights/sensitivity", label: "Sensitivity", icon: "〰" },
      { href: "/dashboard/transparency", label: "Transparency", icon: "🔍" },
      { href: "/dashboard/audit", label: "Audit Log", icon: "📋" },
      { href: "/dashboard/api-docs", label: "API Docs", icon: "📖" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!profile?.email) return;

    const unsubscribe = subscribeToCollection<Notification>(
      "mcdm:notifications",
      (data) => {
        const unread = data.filter(
          (n) => n.userId === profile.email && !n.read
        ).length;
        setUnreadCount(unread);
      }
    );

    return unsubscribe;
  }, [profile?.email]);

  const isLinkActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-white/15 bg-[var(--surface)] p-2 text-white lg:hidden"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-white/10 bg-[var(--background)] transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/15 text-sm text-cyan-300">
            ◈
          </span>
          <div>
            <p className="text-display text-sm font-semibold">MCDM Optimizer</p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
              Phase 2
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isLinkActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                          active
                            ? "bg-cyan-400/10 text-cyan-100"
                            : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-4 space-y-3">
          {profile && (
            <>
              <div className="flex items-center gap-3 px-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-bold text-cyan-300">
                  {profile.displayName?.[0]?.toUpperCase() ?? profile.email?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-white">
                    {profile.displayName ?? profile.email}
                  </p>
                  <p className="text-[10px] capitalize text-[var(--muted)]">
                    {profile.role}
                  </p>
                </div>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 hover:bg-white/5 rounded-lg transition"
                >
                  <span className="text-lg">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full" />
                  )}
                </button>
              </div>

              {notificationsOpen && (
                <div className="fixed right-4 bottom-20 z-50">
                  <NotificationCenter
                    userId={profile.email!}
                    onClose={() => setNotificationsOpen(false)}
                  />
                </div>
              )}
            </>
          )}
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-white/10 hover:text-white"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => signOut()}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-white/10 hover:text-white"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
