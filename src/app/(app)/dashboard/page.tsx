"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { useAuth } from "@/components/auth/auth-provider";
import { getRoleDashboard } from "@/lib/auth/roles";

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.role && profile.role !== "viewer" && profile.role !== "admin") {
      const roleDashboard = getRoleDashboard(profile.role as "merchandiser" | "analyst" | "executive");
      if (roleDashboard !== "/dashboard") {
        router.push(roleDashboard);
      }
    }
  }, [profile?.role, router]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your command center for data-driven product ranking decisions"
      />
      <DashboardHome />
    </>
  );
}
