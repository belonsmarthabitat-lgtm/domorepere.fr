(function () {
  const article = document.querySelector('.article-body');
  const progress = document.querySelector('.reading-progress span');
  const toc = document.getElementById('article-toc');
  const toggle = document.querySelector('.toc-toggle');
  const mobile = window.matchMedia('(max-width: 900px)');

  function updateProgress() {
    if (!article || !progress) return;
    const start = article.getBoundingClientRect().top + window.scrollY;
    const distance = Math.max(article.offsetHeight - window.innerHeight, 1);
    const value = Math.min(1, Math.max(0, (window.scrollY - start) / distance));
    progress.style.width = (value * 100) + '%';
  }

  function setTocForViewport() {
    if (!toc || !toggle) return;
    const expanded = !mobile.matches;
    toc.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
  }

  if (toggle && toc) {
    toggle.addEventListener('click', function () {
      if (!mobile.matches) return;
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toc.hidden = expanded;
    });
  }

  const tocLinks = Array.from(document.querySelectorAll('.toc-nav a'));
  const sections = tocLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (link) { link.removeAttribute('aria-current'); });
        const active = tocLinks.find(function (link) {
          return link.getAttribute('href') === '#' + entry.target.id;
        });
        if (active) active.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-18% 0px -72% 0px' });
    sections.forEach(function (section) { observer.observe(section); });
  }

  setTocForViewport();
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  if (mobile.addEventListener) mobile.addEventListener('change', setTocForViewport);
})();
