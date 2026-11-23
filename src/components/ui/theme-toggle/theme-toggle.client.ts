/**
 * theme-toggle.client.ts — two-state color scheme override aligned with
 * modern-web-guidance `dark-mode-toggle`.
 * Stores `"light"` or `"dark"` in `localStorage("color-scheme")` only when
 * overriding the OS preference; removes the entry when reverting to system.
 */

import { mount } from "@cloudflare/nimbus-docs/client";

declare global {
  interface Window {
    __nbApplyTheme?: (mode?: "light" | "dark" | null) => void;
  }
}

function initThemeToggle(button: HTMLElement): () => void {
  const KEY = "color-scheme";
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function getRenderedMode(): "light" | "dark" {
    return document.documentElement.getAttribute("data-mode") === "dark" ? "dark" : "light";
  }

  function handleClick() {
    const current = getRenderedMode();
    const target = current === "dark" ? "light" : "dark";
    const systemMode = media.matches ? "dark" : "light";

    try {
      if (target === systemMode) {
        localStorage.removeItem(KEY);
        window.__nbApplyTheme?.(null);
      } else {
        localStorage.setItem(KEY, target);
        window.__nbApplyTheme?.(target);
      }
    } catch {
      window.__nbApplyTheme?.(target);
    }
    syncPressed();
  }

  function syncPressed() {
    button.setAttribute("aria-pressed", String(getRenderedMode() === "dark"));
  }

  window.__nbApplyTheme?.();
  syncPressed();
  button.addEventListener("click", handleClick);
  return () => button.removeEventListener("click", handleClick);
}

mount("[data-nb-theme-toggle]", initThemeToggle);
