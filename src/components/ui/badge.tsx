type BadgeVariant = "cyan" | "lime" | "amber" | "pink" | "purple" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  lime: "border-lime-400/30 bg-lime-400/10 text-lime-200",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  pink: "border-pink-400/30 bg-pink-400/10 text-pink-200",
  purple: "border-purple-400/30 bg-purple-400/10 text-purple-200",
  neutral: "border-white/20 bg-white/5 text-[var(--muted)]",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
