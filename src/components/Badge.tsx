import type { PotentialLevel } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "neutral" | "level";
  level?: PotentialLevel;
}

const LEVEL_CLASSES: Record<PotentialLevel, string> = {
  Low: "bg-muted/10 text-muted dark:text-muted-dark",
  Medium: "bg-warning/10 text-warning",
  High: "bg-success/10 text-success"
};

export function Badge({ children, tone = "neutral", level }: BadgeProps) {
  const toneClass =
    tone === "level" && level
      ? LEVEL_CLASSES[level]
      : "bg-accent/10 text-accent dark:text-accent-dark";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  );
}
