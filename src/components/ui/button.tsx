import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border-cyan-300/40 bg-cyan-300/15 text-cyan-100 hover:bg-cyan-300/25 glow",
  secondary:
    "border-white/20 bg-white/5 text-white hover:bg-white/10",
  ghost:
    "border-transparent bg-transparent text-[var(--muted)] hover:bg-white/5 hover:text-white",
  danger:
    "border-red-400/30 bg-red-400/10 text-red-200 hover:bg-red-400/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
