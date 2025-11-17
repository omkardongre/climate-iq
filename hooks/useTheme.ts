"use client";

import { useState, useEffect } from "react";

export type Theme = "light" | "dark" | "high-contrast";

interface ThemeConfig {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  card: string;
  muted: string;
}

const themeConfigs: Record<Theme, ThemeConfig> = {
  light: {
    background: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
    primary: "hsl(142.1 76.2% 36.3%)",
    secondary: "hsl(210 40% 96%)",
    accent: "hsl(210 40% 96%)",
    border: "hsl(214.3 31.8% 91.4%)",
    card: "hsl(0 0% 100%)",
    muted: "hsl(210 40% 96%)",
  },
  dark: {
    background: "hsl(222.2 84% 4.9%)",
    foreground: "hsl(210 40% 98%)",
    primary: "hsl(142.1 70.6% 45.3%)",
    secondary: "hsl(217.2 32.6% 17.5%)",
    accent: "hsl(217.2 32.6% 17.5%)",
    border: "hsl(217.2 32.6% 17.5%)",
    card: "hsl(222.2 84% 4.9%)",
    muted: "hsl(217.2 32.6% 17.5%)",
  },
  "high-contrast": {
    background: "hsl(0 0% 0%)",
    foreground: "hsl(0 0% 100%)",
    primary: "hsl(60 100% 50%)",
    secondary: "hsl(0 0% 20%)",
    accent: "hsl(60 100% 50%)",
    border: "hsl(0 0% 100%)",
    card: "hsl(0 0% 10%)",
    muted: "hsl(0 0% 20%)",
  },
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("climateIQ-theme") as Theme;
    if (savedTheme && themeConfigs[savedTheme]) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const defaultTheme = prefersDark ? "dark" : "light";
      setTheme(defaultTheme);
      applyTheme(defaultTheme);
    }

    // Apply theme immediately on page load
    const currentTheme =
      savedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    applyTheme(currentTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const config = themeConfigs[newTheme];

    // Apply CSS custom properties
    Object.entries(config).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Apply theme class to html element
    root.className = root.className.replace(/theme-\w+/g, "");
    root.classList.add(`theme-${newTheme}`);

    // For compatibility with existing dark mode classes
    if (newTheme === "dark" || newTheme === "high-contrast") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("climateIQ-theme", newTheme);
    applyTheme(newTheme);
  };

  const cycleTheme = () => {
    const themes: Theme[] = ["light", "dark", "high-contrast"];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    changeTheme(themes[nextIndex]);
  };

  const getThemeLabel = (themeType: Theme) => {
    switch (themeType) {
      case "light":
        return "Light Mode";
      case "dark":
        return "Dark Mode";
      case "high-contrast":
        return "High Contrast";
      default:
        return "Light Mode";
    }
  };

  return {
    theme,
    mounted,
    changeTheme,
    cycleTheme,
    getThemeLabel,
    themeConfig: themeConfigs[theme],
  };
}
