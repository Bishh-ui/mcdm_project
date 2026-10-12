import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`glass rounded-2xl p-6 md:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  tag?: string;
  tagColor?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function CardHeader({
  tag,
  tagColor = "text-cyan-200/90",
  title,
  description,
  actions,
}: CardHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {tag && (
          <p
            className={`mb-1.5 text-xs uppercase tracking-[0.2em] ${tagColor}`}
          >
            {tag}
          </p>
        )}
        <h2 className="text-display text-xl font-semibold md:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
