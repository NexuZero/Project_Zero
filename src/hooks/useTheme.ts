import { useCallback, useEffect, useState } from "react";
import { getPreferences, setPreferences } from "@/utils/storage";
import type { Preferences } from "@/types";

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Preferences["theme"]) {
  const isDark = theme === "dark" || (theme === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", isDark);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Preferences["theme"]>(() => getPreferences().theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Preferences["theme"]) => {
    setThemeState(next);
    setPreferences({ theme: next });
  }, []);

  const toggleTheme = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }, [setTheme]);

  const resolvedTheme: "light" | "dark" = theme === "system" ? (prefersDark() ? "dark" : "light") : theme;

  return { theme, resolvedTheme, setTheme, toggleTheme };
}
