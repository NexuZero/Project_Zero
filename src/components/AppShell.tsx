import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Heart, Home, Moon, ShieldCheck, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/favorites", label: "Favorites", icon: Heart, end: false }
];

function navLinkClasses(isActive: boolean): string {
  return `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-accent/10 text-accent dark:text-accent-dark"
      : "text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
  }`;
}

function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border dark:border-border-dark text-ink dark:text-ink-dark transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.06]"
    >
      {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg dark:bg-bg-dark text-ink dark:text-ink-dark">
      <header className="sticky top-0 z-40 border-b border-border dark:border-border-dark bg-bg/80 dark:bg-bg-dark/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent dark:bg-accent-dark text-accent-foreground font-mono-nums text-sm font-bold">
              0
            </span>
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">PROJECT ZERO</span>
          </NavLink>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => navLinkClasses(isActive)}>
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs text-muted dark:text-muted-dark md:flex">
              <ShieldCheck size={14} />
              Your ideas stay on your device
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-8 sm:pb-12">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border dark:border-border-dark bg-bg/95 dark:bg-bg-dark/95 backdrop-blur sm:hidden">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                isActive ? "text-accent dark:text-accent-dark" : "text-muted dark:text-muted-dark"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
