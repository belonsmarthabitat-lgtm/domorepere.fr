(() => {
  "use strict";

  const STORAGE_KEY = "domorepere.preferences.v1";
  const root = document.documentElement;
  const darkMedia = window.matchMedia("(prefers-color-scheme: dark)");
  const reducedMotionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

  const defaults = Object.freeze({
    theme: "auto",
    textSize: "normal",
    spacing: "normal",
    contrast: "normal",
    links: "normal",
    motion: "auto"
  });

  const allowed = {
    theme: new Set(["auto", "light", "dark"]),
    textSize: new Set(["normal", "large"]),
    spacing: new Set(["normal", "comfortable"]),
    contrast: new Set(["normal", "high"]),
    links: new Set(["normal", "visible"]),
    motion: new Set(["auto", "reduced"])
  };

  const cloneDefaults = () => ({ ...defaults });

  function normalize(value) {
    const next = cloneDefaults();
    if (!value || typeof value !== "object") return next;

    for (const key of Object.keys(next)) {
      if (allowed[key].has(value[key])) next[key] = value[key];
    }
    return next;
  }

  function readPreferences() {
    try {
      return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch (_) {
      return cloneDefaults();
    }
  }

  let preferences = readPreferences();

  function resolvedTheme() {
    if (preferences.theme === "light" || preferences.theme === "dark") {
      return preferences.theme;
    }
    return darkMedia.matches ? "dark" : "light";
  }

  function setOptionalAttribute(name, value, defaultValue) {
    if (value === defaultValue) {
      root.removeAttribute(name);
    } else {
      root.setAttribute(name, value);
    }
  }

  function ensureColorSchemeMeta() {
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "color-scheme";
      meta.content = "light dark";
      document.head.appendChild(meta);
    }
  }

  function updateThemeColor() {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    meta.content = resolvedTheme() === "dark" ? "#0f1516" : "#0d665d";
  }

  function applyPreferences() {
    const theme = resolvedTheme();

    root.setAttribute("data-theme", theme);
    root.setAttribute("data-theme-mode", preferences.theme);
    setOptionalAttribute("data-text-size", preferences.textSize, "normal");
    setOptionalAttribute("data-spacing", preferences.spacing, "normal");
    setOptionalAttribute("data-contrast", preferences.contrast, "normal");
    setOptionalAttribute("data-links", preferences.links, "normal");
    setOptionalAttribute("data-motion", preferences.motion, "auto");
    root.style.colorScheme = theme;

    updateThemeColor();
  }

  function savePreferences() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (_) {
      /* La navigation reste fonctionnelle si le stockage est indisponible. */
    }
  }

  ensureColorSchemeMeta();
  applyPreferences();

  function buildInterface() {
    if (document.querySelector("[data-site-preferences-root]")) return;

    const container = document.createElement("div");
    container.className = "site-preferences";
    container.setAttribute("data-site-preferences-root", "");

    container.innerHTML = `
      <div class="site-preferences-toolbar" role="group" aria-label="Affichage et accessibilité">
        <button type="button" class="site-preferences-quick-theme" data-preference-theme-toggle>
          <span aria-hidden="true" data-preference-theme-icon>◐</span>
          <span class="preferences-sr-only" data-preference-theme-label>Changer de thème</span>
        </button>
        <button type="button" class="site-preferences-open" aria-expanded="false" aria-controls="site-preferences-panel" data-preference-open>
          <span aria-hidden="true">Aa</span>
          <span class="preferences-sr-only">Options d’accessibilité</span>
        </button>
      </div>

      <section class="site-preferences-panel" id="site-preferences-panel" role="dialog" aria-modal="false" aria-labelledby="site-preferences-title" hidden>
        <div class="site-preferences-panel__header">
          <div>
            <p class="site-preferences-panel__eyebrow">Confort de lecture</p>
            <h2 id="site-preferences-title">Affichage & accessibilité</h2>
          </div>
          <button type="button" class="site-preferences-close" aria-label="Fermer les options d’accessibilité" data-preference-close>×</button>
        </div>

        <fieldset class="site-preferences-fieldset">
          <legend>Thème</legend>
          <div class="site-preferences-segmented">
            <label><input type="radio" name="site-theme" value="auto"> <span>Auto</span></label>
            <label><input type="radio" name="site-theme" value="light"> <span>Jour</span></label>
            <label><input type="radio" name="site-theme" value="dark"> <span>Nuit</span></label>
          </div>
          <p class="site-preferences-help">Auto suit le réglage clair ou sombre de votre appareil.</p>
        </fieldset>

        <fieldset class="site-preferences-fieldset">
          <legend>Lecture</legend>
          <label class="site-preferences-switch">
            <input type="checkbox" data-preference-checkbox="textSize">
            <span><strong>Texte plus grand</strong><small>Augmente la taille générale du texte.</small></span>
          </label>
          <label class="site-preferences-switch">
            <input type="checkbox" data-preference-checkbox="spacing">
            <span><strong>Espacement confortable</strong><small>Augmente l’interligne et l’espace entre les contenus.</small></span>
          </label>
          <label class="site-preferences-switch">
            <input type="checkbox" data-preference-checkbox="contrast">
            <span><strong>Contraste renforcé</strong><small>Renforce textes, bordures et états de focus.</small></span>
          </label>
          <label class="site-preferences-switch">
            <input type="checkbox" data-preference-checkbox="links">
            <span><strong>Liens plus visibles</strong><small>Souligne les liens dans le contenu principal.</small></span>
          </label>
          <label class="site-preferences-switch">
            <input type="checkbox" data-preference-checkbox="motion">
            <span><strong>Réduire les animations</strong><small>Supprime les transitions et mouvements décoratifs.</small></span>
          </label>
        </fieldset>

        <div class="site-preferences-panel__footer">
          <button type="button" class="site-preferences-reset" data-preference-reset>Réinitialiser</button>
          <span class="site-preferences-status" aria-live="polite" data-preference-status></span>
        </div>
      </section>
    `;

    document.body.appendChild(container);

    const openButton = container.querySelector("[data-preference-open]");
    const closeButton = container.querySelector("[data-preference-close]");
    const panel = container.querySelector(".site-preferences-panel");
    const quickThemeButton = container.querySelector("[data-preference-theme-toggle]");
    const themeIcon = container.querySelector("[data-preference-theme-icon]");
    const themeLabel = container.querySelector("[data-preference-theme-label]");
    const status = container.querySelector("[data-preference-status]");
    const resetButton = container.querySelector("[data-preference-reset]");
    const themeRadios = [...container.querySelectorAll('input[name="site-theme"]')];
    const checkboxes = [...container.querySelectorAll("[data-preference-checkbox]")];

    const values = {
      textSize: { checked: "large", unchecked: "normal" },
      spacing: { checked: "comfortable", unchecked: "normal" },
      contrast: { checked: "high", unchecked: "normal" },
      links: { checked: "visible", unchecked: "normal" },
      motion: { checked: "reduced", unchecked: "auto" }
    };

    function announce(message) {
      status.textContent = "";
      window.requestAnimationFrame(() => {
        status.textContent = message;
      });
    }

    function syncInterface() {
      const theme = resolvedTheme();
      const nextMode = theme === "dark" ? "jour" : "nuit";

      themeIcon.textContent = theme === "dark" ? "☀" : "☾";
      themeLabel.textContent = `Passer en mode ${nextMode}`;
      quickThemeButton.setAttribute("aria-label", `Passer en mode ${nextMode}`);
      quickThemeButton.setAttribute("title", `Passer en mode ${nextMode}`);

      for (const radio of themeRadios) {
        radio.checked = radio.value === preferences.theme;
      }

      for (const checkbox of checkboxes) {
        const key = checkbox.getAttribute("data-preference-checkbox");
        checkbox.checked = preferences[key] === values[key].checked;
      }
    }

    function commit(message) {
      savePreferences();
      applyPreferences();
      syncInterface();
      announce(message);
    }

    function openPanel() {
      panel.hidden = false;
      openButton.setAttribute("aria-expanded", "true");
      closeButton.focus();
    }

    function closePanel({ restoreFocus = true } = {}) {
      panel.hidden = true;
      openButton.setAttribute("aria-expanded", "false");
      if (restoreFocus) openButton.focus();
    }

    openButton.addEventListener("click", () => {
      if (panel.hidden) openPanel();
      else closePanel();
    });

    closeButton.addEventListener("click", () => closePanel());

    quickThemeButton.addEventListener("click", () => {
      preferences.theme = resolvedTheme() === "dark" ? "light" : "dark";
      commit(preferences.theme === "dark" ? "Mode nuit activé." : "Mode jour activé.");
    });

    for (const radio of themeRadios) {
      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        preferences.theme = radio.value;
        commit(
          radio.value === "auto"
            ? "Thème automatique activé."
            : radio.value === "dark"
              ? "Mode nuit activé."
              : "Mode jour activé."
        );
      });
    }

    for (const checkbox of checkboxes) {
      checkbox.addEventListener("change", () => {
        const key = checkbox.getAttribute("data-preference-checkbox");
        preferences[key] = checkbox.checked ? values[key].checked : values[key].unchecked;
        commit("Préférence enregistrée.");
      });
    }

    resetButton.addEventListener("click", () => {
      preferences = cloneDefaults();
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {
        /* Sans effet sur le fonctionnement de la page. */
      }
      applyPreferences();
      syncInterface();
      announce("Préférences réinitialisées.");
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) closePanel();
    });

    document.addEventListener("pointerdown", event => {
      if (panel.hidden) return;
      if (container.contains(event.target)) return;
      closePanel({ restoreFocus: false });
    });

    syncInterface();
  }

  const onSystemThemeChange = () => {
    if (preferences.theme !== "auto") return;
    applyPreferences();
    const rootUI = document.querySelector("[data-site-preferences-root]");
    if (rootUI) {
      const button = rootUI.querySelector("[data-preference-theme-toggle]");
      const icon = rootUI.querySelector("[data-preference-theme-icon]");
      const label = rootUI.querySelector("[data-preference-theme-label]");
      const theme = resolvedTheme();
      const nextMode = theme === "dark" ? "jour" : "nuit";
      icon.textContent = theme === "dark" ? "☀" : "☾";
      label.textContent = `Passer en mode ${nextMode}`;
      button.setAttribute("aria-label", `Passer en mode ${nextMode}`);
      button.setAttribute("title", `Passer en mode ${nextMode}`);
    }
  };

  if (typeof darkMedia.addEventListener === "function") {
    darkMedia.addEventListener("change", onSystemThemeChange);
  } else if (typeof darkMedia.addListener === "function") {
    darkMedia.addListener(onSystemThemeChange);
  }

  /* Force la consultation de la préférence système même sans option manuelle. */
  void reducedMotionMedia.matches;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildInterface, { once: true });
  } else {
    buildInterface();
  }
})();