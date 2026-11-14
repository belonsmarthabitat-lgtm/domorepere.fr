(() => {
  "use strict";

  const container = document.querySelector("[data-latest-article]");
  if (!container) return;

  const link = container.querySelector("[data-latest-article-link]");
  const title = container.querySelector("[data-latest-article-title]");
  if (!link || !title) return;

  const editorialDate = (article) => {
    const published = Date.parse(article.datePublished || "");
    const modified = Date.parse(article.dateModified || "");
    const validPublished = Number.isNaN(published) ? -Infinity : published;
    const validModified = Number.isNaN(modified) ? -Infinity : modified;
    return Math.max(validPublished, validModified);
  };

  fetch("assets/data/articles.json", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("Impossible de charger les articles");
      return response.json();
    })
    .then((data) => {
      const articles = Array.isArray(data) ? data : data.articles;
      if (!Array.isArray(articles)) return;

      const latest = articles.reduce((selected, article) => {
        if (!article || !article.title || !article.url) return selected;
        if (!Number.isFinite(editorialDate(article))) return selected;
        if (!selected || editorialDate(article) > editorialDate(selected)) return article;
        return selected;
      }, null);

      if (!latest) return;

      title.textContent = latest.title;
      link.href = latest.url;
      link.setAttribute("aria-label", `Lire l’article : ${latest.title}`);
    })
    .catch(() => {
      // Le contenu HTML de secours reste affiché si le JSON est indisponible.
    });
})();

