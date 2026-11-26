(() => {
  "use strict";

  const mount = document.querySelector("[data-global-sidebar]") || document.querySelector(".sidebar");
  if (!mount || mount.dataset.sidebarEnhanced === "true") return;

  mount.dataset.sidebarEnhanced = "true";

  const currentFile = (() => {
    const path = window.location.pathname.split("/").filter(Boolean).pop();
    return path || "index.html";
  })();

  const escapeHtml = value => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const normalize = value => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9+\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parseDate = value => {
    const time = Date.parse(value + "T12:00:00");
    return Number.isNaN(time) ? 0 : time;
  };

  const mostRecentDate = article => Math.max(
    parseDate(article.datePublished),
    parseDate(article.dateModified)
  );

  const formatDate = value => {
    if (!value) return "";
    const date = new Date(value + "T12:00:00");
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  const createCard = (className, html) => {
    const section = document.createElement("section");
    section.className = "side-card sidebar-global-card " + className;
    section.innerHTML = html;
    return section;
  };

  const searchCard = createCard("sidebar-search", `
    <span class="side-kicker">Recherche</span>
    <h2>Rechercher dans les guides</h2>
    <div class="sidebar-search-form" role="search">
      <label class="preferences-sr-only" for="sidebar-search-input">Rechercher un guide DomoRepère</label>
      <div class="sidebar-search-field">
        <input
          id="sidebar-search-input"
          class="sidebar-search-input"
          type="search"
          inputmode="search"
          autocomplete="off"
          spellcheck="false"
          placeholder="Ex. Zigbee, chauffage…"
          aria-controls="sidebar-search-results"
          aria-expanded="false"
          disabled
        >
        <button class="sidebar-search-clear" type="button" aria-label="Effacer la recherche" hidden>×</button>
      </div>
      <p class="sidebar-search-status" id="sidebar-search-status" aria-live="polite">Chargement de l’index…</p>
      <div class="sidebar-search-results" id="sidebar-search-results" hidden></div>
    </div>
  `);
  mount.prepend(searchCard);

  // Sur mobile, le sommaire reste avant l'article sans utiliser display: contents,
  // plus fragile sur Safari. La sidebar garde ainsi de vraies cartes visibles.
  const articleGrid = document.querySelector(".page-article .content-grid");
  const articleShell = articleGrid ? articleGrid.querySelector(".article-shell") : null;
  const articleTocCard = mount.querySelector(".toc-card");
  const articleMobile = window.matchMedia("(max-width: 900px)");

  const syncArticleSidebarLayout = () => {
    if (!articleGrid || !articleShell || !articleTocCard) return;

    if (articleMobile.matches) {
      if (articleTocCard.parentElement !== articleGrid) {
        articleGrid.insertBefore(articleTocCard, articleShell);
      }
      return;
    }

    if (articleTocCard.parentElement !== mount) {
      const takeaway = mount.querySelector(".takeaway-card");
      if (takeaway) mount.insertBefore(articleTocCard, takeaway);
      else mount.appendChild(articleTocCard);
    }
  };

  syncArticleSidebarLayout();
  if (articleMobile.addEventListener) {
    articleMobile.addEventListener("change", syncArticleSidebarLayout);
  }

  const searchInput = searchCard.querySelector(".sidebar-search-input");
  const searchClear = searchCard.querySelector(".sidebar-search-clear");
  const searchStatus = searchCard.querySelector(".sidebar-search-status");
  const searchResults = searchCard.querySelector(".sidebar-search-results");

  let searchArticles = [];

  const scoreArticle = (article, query) => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return 0;

    const tokens = normalizedQuery.split(" ").filter(token => token.length >= 2);
    if (!tokens.length) return 0;

    const title = normalize(article.title);
    const summary = normalize(article.summary);
    const category = normalize(article.category);
    const keywords = normalize(Array.isArray(article.keywords) ? article.keywords.join(" ") : article.keywords);

    let score = 0;
    let matchedTokens = 0;

    if (title === normalizedQuery) score += 40;
    else if (title.includes(normalizedQuery)) score += 20;

    if (keywords.includes(normalizedQuery)) score += 12;
    if (summary.includes(normalizedQuery)) score += 7;
    if (category.includes(normalizedQuery)) score += 6;

    for (const token of tokens) {
      let matched = false;
      if (title.includes(token)) {
        score += 8;
        matched = true;
      }
      if (keywords.includes(token)) {
        score += 5;
        matched = true;
      }
      if (category.includes(token)) {
        score += 4;
        matched = true;
      }
      if (summary.includes(token)) {
        score += 2;
        matched = true;
      }
      if (matched) matchedTokens += 1;
      else score -= 3;
    }

    const minimumMatchedTokens = tokens.length > 1
      ? Math.ceil(tokens.length * 0.6)
      : 1;

    if (matchedTokens < minimumMatchedTokens) return 0;
    return Math.max(score, 0);
  };

  const closeSearchResults = () => {
    searchResults.hidden = true;
    searchResults.innerHTML = "";
    searchInput.setAttribute("aria-expanded", "false");
  };

  const renderSearchResults = query => {
    const normalizedQuery = normalize(query);
    searchClear.hidden = normalizedQuery.length === 0;

    if (normalizedQuery.length < 2) {
      closeSearchResults();
      searchStatus.textContent = normalizedQuery.length ? "Saisissez au moins 2 caractères." : "Titre, sujet ou technologie.";
      return;
    }

    const ranked = searchArticles
      .map(article => ({ article, score: scoreArticle(article, normalizedQuery) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || mostRecentDate(b.article) - mostRecentDate(a.article))
      .slice(0, 5);

    if (!ranked.length) {
      searchResults.innerHTML = '<p class="sidebar-search-empty">Aucun guide trouvé.</p>';
      searchResults.hidden = false;
      searchInput.setAttribute("aria-expanded", "true");
      searchStatus.textContent = "Aucun résultat.";
      return;
    }

    searchResults.innerHTML = ranked.map(({ article }) => `
      <a class="sidebar-search-result" href="${escapeHtml(article.url)}">
        <span class="sidebar-search-result-category">${escapeHtml(article.category || "Guide")}</span>
        <strong>${escapeHtml(article.title)}</strong>
        <span>${escapeHtml(article.summary || "")}</span>
      </a>
    `).join("");

    searchResults.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
    searchStatus.textContent = ranked.length === 1 ? "1 résultat." : `${ranked.length} résultats.`;
  };

  searchInput.addEventListener("input", () => {
    renderSearchResults(searchInput.value);
  });

  searchInput.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      searchInput.value = "";
      renderSearchResults("");
      searchInput.focus();
      return;
    }

    if (event.key === "ArrowDown" && !searchResults.hidden) {
      const firstResult = searchResults.querySelector("a");
      if (firstResult) {
        event.preventDefault();
        firstResult.focus();
      }
    }
  });

  searchResults.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      searchInput.focus();
      closeSearchResults();
    }
  });

  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    renderSearchResults("");
    searchInput.focus();
  });

  const addPartnerCard = () => {
    mount.appendChild(createCard("sidebar-partner", `
      <span class="side-kicker">Partenaire matériel</span>
      <h2>Du besoin au matériel compatible</h2>
      <p>DomoRepère privilégie le diagnostic et la compatibilité. Les liens partenaires sont signalés clairement lorsqu’un équipement est pertinent.</p>
      <a class="sidebar-partner-link" href="index.html#partenaires">Voir la sélection matériel →</a>
    `));
  };

  const addSocialCard = () => {
    mount.appendChild(createCard("sidebar-social", `
      <span class="side-kicker">Réseaux sociaux</span>
      <div class="sidebar-social-icons" aria-hidden="true">
        <span class="sidebar-social-icon">f</span>
        <span class="sidebar-social-icon">◎</span>
        <span class="sidebar-social-icon">▶</span>
        <span class="sidebar-social-icon">♪</span>
      </div>
      <p class="sidebar-social-joke">Pour le moment, j’ai rien de tout ça… mais ça fait classe.</p>
    `));
  };

  const addLatestCard = article => {
    if (!article) return;

    const published = parseDate(article.datePublished);
    const modified = parseDate(article.dateModified);
    const isUpdated = modified > published;
    const date = isUpdated ? article.dateModified : article.datePublished;
    const label = isUpdated ? "Mis à jour le" : "Publié le";

    mount.appendChild(createCard("sidebar-latest", `
      <a class="sidebar-latest-link" href="${escapeHtml(article.url)}">
        <span class="side-kicker">À lire ensuite</span>
        <strong class="sidebar-latest-title">${escapeHtml(article.title)}</strong>
        <span class="sidebar-latest-meta">${label} ${escapeHtml(formatDate(date))}</span>
      </a>
    `));
  };

  fetch("assets/data/articles.json", { cache: "no-cache" })
    .then(response => {
      if (!response.ok) throw new Error("articles.json unavailable");
      return response.json();
    })
    .then(data => {
      const articles = Array.isArray(data.articles) ? data.articles.slice() : [];
      articles.sort((a, b) => mostRecentDate(b) - mostRecentDate(a));

      searchArticles = articles;
      searchInput.disabled = false;
      searchStatus.textContent = "Titre, sujet ou technologie.";

      const latest = articles.find(article => article.url !== currentFile) || articles[0] || null;
      addLatestCard(latest);
      addPartnerCard();
      addSocialCard();
    })
    .catch(() => {
      searchInput.disabled = true;
      searchStatus.textContent = "Recherche momentanément indisponible.";
      addPartnerCard();
      addSocialCard();
    });
})();