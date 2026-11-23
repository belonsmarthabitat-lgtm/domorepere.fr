(function () {
  const article = document.querySelector('.article-body');
  const progress = document.querySelector('.reading-progress span');
  const toc = document.getElementById('article-toc');
  const toggle = document.querySelector('.toc-toggle');
  const mobile = window.matchMedia('(max-width: 900px)');
  const header = document.querySelector('.site-header');

  function getReadingMinutes() {
    if (!article) return 1;

    const text = (article.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();

    const words = text ? text.split(' ').filter(Boolean).length : 0;

    return {
      words: words,
      minutes: Math.max(1, Math.ceil(words / 220))
    };
  }

  function updateReadingTime() {
    if (!article) return;

    const reading = getReadingMinutes();
    const label = '⏱️ ' + reading.minutes + ' min de lecture';

    const meta = document.querySelector('.meta');

    if (meta) {
      const readingTime = Array.from(meta.querySelectorAll('span')).find(function (span) {
        return /⏱|min\b/i.test(span.textContent || '');
      });

      if (readingTime) {
        readingTime.textContent = label;
        readingTime.setAttribute(
          'title',
          reading.words.toLocaleString('fr-FR') +
            ' mots — estimation à 220 mots par minute'
        );
      }
    }

    let mobileReadingTime = document.querySelector('.reading-time-mobile');

    if (mobile.matches) {
      if (!mobileReadingTime) {
        mobileReadingTime = document.createElement('div');
        mobileReadingTime.className = 'reading-time-mobile';
        mobileReadingTime.setAttribute('aria-label', 'Temps de lecture estimé');

        mobileReadingTime.style.display = 'inline-flex';
        mobileReadingTime.style.alignItems = 'center';
        mobileReadingTime.style.margin = '0 0 1rem';
        mobileReadingTime.style.padding = '.5rem .75rem';
        mobileReadingTime.style.border = '1px solid var(--color-border)';
        mobileReadingTime.style.borderRadius = '999px';
        mobileReadingTime.style.background = 'var(--color-surface-soft)';
        mobileReadingTime.style.color = 'var(--color-text-muted)';
        mobileReadingTime.style.fontSize = '.82rem';
        mobileReadingTime.style.fontWeight = '650';
        mobileReadingTime.style.lineHeight = '1.2';

        article.parentNode.insertBefore(mobileReadingTime, article);
      }

      mobileReadingTime.textContent = label;
      mobileReadingTime.title =
        reading.words.toLocaleString('fr-FR') +
        ' mots — estimation à 220 mots par minute';
    } else if (mobileReadingTime) {
      mobileReadingTime.remove();
    }
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

  const tocItems = tocLinks
    .map(function (link) {
      const href = link.getAttribute('href');

      if (!href || href.charAt(0) !== '#') return null;

      const section = document.getElementById(href.slice(1));

      return section
        ? {
            link: link,
            section: section
          }
        : null;
    })
    .filter(Boolean);

  let activeLink = null;
  let ticking = false;

  function setActiveLink(link) {
    if (link === activeLink) return;

    tocLinks.forEach(function (tocLink) {
      tocLink.removeAttribute('aria-current');
    });

    if (link) {
      link.setAttribute('aria-current', 'true');
    }

    activeLink = link;
  }

  function updateReadingState() {
    if (article && progress) {
      const start =
        article.getBoundingClientRect().top + window.scrollY;

      const distance =
        Math.max(article.offsetHeight - window.innerHeight, 1);

      const value =
        Math.min(
          1,
          Math.max(
            0,
            (window.scrollY - start) / distance
          )
        );

      progress.style.width = (value * 100) + '%';
    }

    if (tocItems.length) {
      const headerBottom =
        header
          ? header.getBoundingClientRect().bottom
          : 0;

      const readingLine =
        Math.min(
          window.innerHeight * 0.35,
          headerBottom + 180
        );

      let current = null;

      tocItems.forEach(function (item) {
        if (
          item.section.getBoundingClientRect().top <=
          readingLine
        ) {
          current = item.link;
        }
      });

      if (
        !current &&
        article &&
        article.getBoundingClientRect().top <= readingLine
      ) {
        current = tocItems[0].link;
      }

      const pageBottom =
        window.scrollY + window.innerHeight;

      const documentHeight =
        document.documentElement.scrollHeight;

      if (pageBottom >= documentHeight - 2) {
        current =
          tocItems[tocItems.length - 1].link;
      }

      setActiveLink(current);
    }

    ticking = false;
  }

  function requestReadingUpdate() {
    if (ticking) return;

    ticking = true;

    window.requestAnimationFrame(
      updateReadingState
    );
  }

  updateReadingTime();
  setTocForViewport();
  updateReadingState();

  window.addEventListener(
    'scroll',
    requestReadingUpdate,
    { passive: true }
  );

  window.addEventListener(
    'resize',
    requestReadingUpdate
  );

  window.addEventListener(
    'load',
    function () {
      updateReadingTime();
      requestReadingUpdate();
    }
  );

  window.addEventListener(
    'hashchange',
    requestReadingUpdate
  );

  if (mobile.addEventListener) {
    mobile.addEventListener(
      'change',
      function () {
        updateReadingTime();
        setTocForViewport();
        requestReadingUpdate();
      }
    );
  }
})();
