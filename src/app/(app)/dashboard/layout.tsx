import { AuthProvider } from "@/components/auth/auth-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardShell>{children}</DashboardShell>
        <OnboardingFlow />
      </AuthProvider>
    </ThemeProvider>
  );
}
