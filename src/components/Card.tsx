import type { HTMLAttributes } from "react";

export function Card({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
