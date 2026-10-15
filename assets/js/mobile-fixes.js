(function () {
  'use strict';

  function initBackToTop() {
    if (!document.body.classList.contains('page-article') ||
        document.body.classList.contains('page-lab')) return;

    var article = document.querySelector('.article-body');
    if (!article) return;

    var button = document.createElement('button');
    button.className = 'back-to-top';
    button.type = 'button';
    button.setAttribute('aria-label', 'Retour en haut de la page');
    button.setAttribute('title', 'Retour en haut');
    button.setAttribute('aria-hidden', 'true');
    button.tabIndex = -1;
    button.innerHTML = '<span aria-hidden="true">↑</span>';
    document.body.appendChild(button);

    var footer = document.querySelector('footer');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function calculateThreshold() {
      var viewportThreshold = Math.max(320, Math.round(window.innerHeight * 0.5));
      var maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );

      if (!maxScroll) return viewportThreshold;

      return Math.min(
        viewportThreshold,
        Math.max(160, Math.round(maxScroll * 0.35))
      );
    }

    var threshold = calculateThreshold();
    var visible = false;
    var ticking = false;

    function updateButton() {
      var shouldShow = window.scrollY > threshold;

      if (shouldShow !== visible) {
        visible = shouldShow;
        button.classList.toggle('is-visible', visible);
        button.setAttribute('aria-hidden', String(!visible));
        button.tabIndex = visible ? 0 : -1;
      }

      var footerLift = 0;
      if (visible && footer) {
        var footerTop = footer.getBoundingClientRect().top;
        footerLift = Math.max(0, Math.round(window.innerHeight - footerTop + 12));
      }
      button.style.setProperty('--back-to-top-lift', footerLift + 'px');
      ticking = false;
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateButton);
    }

    button.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
      });
    });

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', function () {
      threshold = calculateThreshold();
      requestUpdate();
    });
    updateButton();
  }

  initBackToTop();

  var mobile = window.matchMedia('(max-width: 720px)');
  var figures = Array.prototype.slice.call(document.querySelectorAll('.article-figure'));
  if (!figures.length) return;

  var viewer;
  var viewerImage;
  var viewerTitle;
  var viewerCanvas;
  var closeButton;
  var lastTrigger;
  var historyEntryActive = false;
  var historyClosePending = false;

  function ensureViewer() {
    if (viewer) return;

    viewer = document.createElement('div');
    viewer.className = 'mobile-image-viewer';
    viewer.hidden = true;
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-label', 'Illustration agrandie');
    viewer.innerHTML =
      '<div class="mobile-image-viewer__bar">' +
        '<span></span>' +
        '<button class="mobile-image-viewer__close" type="button" aria-label="Fermer l’illustration">×</button>' +
      '</div>' +
      '<div class="mobile-image-viewer__canvas"><img alt=""></div>';

    document.body.appendChild(viewer);
    viewerImage = viewer.querySelector('img');
    viewerTitle = viewer.querySelector('.mobile-image-viewer__bar span');
    viewerCanvas = viewer.querySelector('.mobile-image-viewer__canvas');
    closeButton = viewer.querySelector('.mobile-image-viewer__close');

    closeButton.addEventListener('click', closeViewer);
    viewerCanvas.addEventListener('click', function (event) {
      if (event.target === viewerCanvas) closeViewer();
    });
  }

  function openViewer(image) {
    if (!mobile.matches) return;
    ensureViewer();
    lastTrigger = image;
    viewerImage.src = image.currentSrc || image.src;
    viewerImage.alt = image.alt || '';
    viewerTitle.textContent = image.alt || 'Illustration DomoRepère';
    viewer.hidden = false;
    document.body.classList.add('mobile-image-viewer-open');

    try {
      window.history.pushState({ mobileImageViewer: true }, '', window.location.href);
      historyEntryActive = true;
    } catch (error) {
      historyEntryActive = false;
    }

    closeButton.focus();
  }

  function closeViewer() {
    if (!viewer || viewer.hidden) return;

    if (historyEntryActive) {
      if (historyClosePending) return;
      historyClosePending = true;
      window.history.back();
      return;
    }

    hideViewer();
  }

  function hideViewer() {
    if (!viewer || viewer.hidden) return;
    viewer.hidden = true;
    viewerImage.removeAttribute('src');
    document.body.classList.remove('mobile-image-viewer-open');
    if (lastTrigger) lastTrigger.focus();
  }

  figures.forEach(function (figure) {
    var image = figure.querySelector('img');
    if (!image) return;

    figure.classList.add('mobile-zoom-ready');
    image.classList.add('mobile-zoomable');
    image.setAttribute('tabindex', '0');
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', (image.alt || 'Illustration') + ' — agrandir');
    image.addEventListener('click', function () { openViewer(image); });
    image.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openViewer(image);
      }
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeViewer();
  });

  window.addEventListener('popstate', function () {
    if (!viewer || viewer.hidden) return;
    historyEntryActive = false;
    historyClosePending = false;
    hideViewer();
  });
})();
