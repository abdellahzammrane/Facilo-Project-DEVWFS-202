(() => {
  const root = document.documentElement;
  const toggle = document.querySelector("#theme");
  if (!toggle) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  let transitioning = false;

  const syncToggle = (theme) => {
    const isLight = theme === "light";
    toggle.setAttribute("aria-pressed", String(isLight));
    toggle.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} theme`);
    toggle.title = `Switch to ${isLight ? "dark" : "light"} theme`;
    if (themeColorMeta) themeColorMeta.setAttribute("content", isLight ? "#FAF6F0" : "#1E120B");
  };

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    syncToggle(theme);
    try {
      window.localStorage.setItem("facilo-theme", theme);
    } catch (_) {
      // Theme changes still work for this visit if storage is unavailable.
    }
  };

  syncToggle(root.dataset.theme === "light" ? "light" : "dark");

  toggle.onclick = () => {
    if (transitioning) return;

    const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
    const bounds = toggle.getBoundingClientRect();
    const originX = `${bounds.left + bounds.width / 2}px`;
    const originY = `${bounds.top + bounds.height / 2}px`;

    if (reducedMotion.matches) {
      applyTheme(nextTheme);
      return;
    }

    transitioning = true;
    root.style.setProperty("--theme-origin-x", originX);
    root.style.setProperty("--theme-origin-y", originY);

    const overlay = document.createElement("div");
    overlay.className = `theme-transition-overlay theme-transition-overlay--${nextTheme}`;
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.setProperty("--theme-origin-x", originX);
    overlay.style.setProperty("--theme-origin-y", originY);
    document.body.append(overlay);

    root.classList.add("theme-transitioning");
    void root.offsetWidth;
    applyTheme(nextTheme);
    window.requestAnimationFrame(() => root.classList.add("theme-transition-revealing"));

    const finishTransition = () => {
      overlay.remove();
      root.classList.remove("theme-transitioning", "theme-transition-revealing");
      transitioning = false;
    };

    overlay.addEventListener("animationend", () => overlay.remove(), { once: true });
    window.setTimeout(finishTransition, 1600);
  };

  window.addEventListener("storage", (event) => {
    if (event.key === "facilo-theme" && (event.newValue === "light" || event.newValue === "dark")) {
      root.dataset.theme = event.newValue;
      syncToggle(event.newValue);
    }
  });
})();
