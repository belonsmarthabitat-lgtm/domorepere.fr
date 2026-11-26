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

  initRelatedGuides();
  initImageLightbox();
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

  function initRelatedGuides() {
    const nextLinks = document.querySelector('.next-links');
    if (!nextLinks) return;

    const currentFile = window.location.pathname.split('/').filter(Boolean).pop() || 'index.html';
    const section = document.createElement('section');
    section.className = 'related-guides';
    section.setAttribute('aria-labelledby', 'related-guides-title');

    const heading = document.createElement('div');
    heading.className = 'related-guides-heading';
    heading.innerHTML = '<span class="side-kicker">À lire ensuite</span><h2 id="related-guides-title">Continuer sur ce sujet</h2>';

    nextLinks.parentNode.insertBefore(section, nextLinks);
    section.appendChild(heading);
    section.appendChild(nextLinks);

    fetch('assets/data/articles.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('articles.json unavailable');
        return response.json();
      })
      .then(function (data) {
        const articles = Array.isArray(data.articles) ? data.articles : [];
        const current = articles.find(function (item) { return item.url === currentFile; });
        if (!current || !Array.isArray(current.related)) return;

        const related = current.related
          .map(function (url) {
            return articles.find(function (item) { return item.url === url; });
          })
          .filter(Boolean)
          .slice(0, 3);

        if (!related.length) return;

        nextLinks.innerHTML = related.map(function (item) {
          return '<a class="next-card" href="' + item.url + '">' +
            '<span>' + item.category + '</span>' +
            '<strong>' + item.title + ' →</strong>' +
          '</a>';
        }).join('');
      })
      .catch(function () {
        // Les liens statiques présents dans le HTML restent disponibles.
      });
  }

  function initImageLightbox() {
    const images = Array.from(document.querySelectorAll('.article-figure img'));
    if (!images.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'image-lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image agrandie');
    overlay.innerHTML =
      '<div class="image-lightbox-inner">' +
        '<button class="image-lightbox-close" type="button" aria-label="Fermer l’image agrandie">×</button>' +
        '<button class="image-lightbox-nav image-lightbox-prev" type="button" aria-label="Image précédente">‹</button>' +
        '<figure><img class="image-lightbox-image" alt=""><figcaption class="image-lightbox-caption"></figcaption></figure>' +
        '<button class="image-lightbox-nav image-lightbox-next" type="button" aria-label="Image suivante">›</button>' +
      '</div>';

    document.body.appendChild(overlay);

    const lightboxImage = overlay.querySelector('.image-lightbox-image');
    const caption = overlay.querySelector('.image-lightbox-caption');
    const closeButton = overlay.querySelector('.image-lightbox-close');
    const prevButton = overlay.querySelector('.image-lightbox-prev');
    const nextButton = overlay.querySelector('.image-lightbox-next');
    let currentIndex = 0;
    let lastTrigger = null;

    function show(index) {
      currentIndex = (index + images.length) % images.length;
      const image = images[currentIndex];
      const figure = image.closest('.article-figure');
      const figcaption = figure ? figure.querySelector('figcaption') : null;

      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt || '';
      caption.textContent = figcaption ? figcaption.textContent.trim() : image.alt || '';
      caption.hidden = !caption.textContent;
      prevButton.hidden = images.length < 2;
      nextButton.hidden = images.length < 2;
    }

    function open(index, trigger) {
      lastTrigger = trigger;
      show(index);
      overlay.hidden = false;
      document.body.classList.add('lightbox-open');
      closeButton.focus();
    }

    function close() {
      overlay.hidden = true;
      document.body.classList.remove('lightbox-open');
      lightboxImage.removeAttribute('src');
      if (lastTrigger) lastTrigger.focus();
    }

    images.forEach(function (image, index) {
      image.loading = 'lazy';
      image.decoding = 'async';
      image.classList.add('lightbox-trigger');
      image.setAttribute('tabindex', '0');
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', 'Agrandir l’image : ' + (image.alt || 'illustration'));
      image.addEventListener('click', function () { open(index, image); });
      image.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(index, image);
        }
      });
    });

    closeButton.addEventListener('click', close);
    prevButton.addEventListener('click', function () { show(currentIndex - 1); });
    nextButton.addEventListener('click', function () { show(currentIndex + 1); });
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) close();
    });
    document.addEventListener('keydown', function (event) {
      if (overlay.hidden) return;
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowLeft' && images.length > 1) show(currentIndex - 1);
      else if (event.key === 'ArrowRight' && images.length > 1) show(currentIndex + 1);
    });
  }

})();
