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

      const latest = articles.find(article => article.url !== currentFile) || articles[0] || null;
      addLatestCard(latest);
      addPartnerCard();
      addSocialCard();
    })
    .catch(() => {
      addPartnerCard();
      addSocialCard();
    });
})();
