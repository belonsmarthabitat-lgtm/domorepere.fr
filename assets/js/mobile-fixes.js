(function () {
  'use strict';

  var mobile = window.matchMedia('(max-width: 720px)');
  var figures = Array.prototype.slice.call(document.querySelectorAll('.article-figure'));
  if (!figures.length) return;

  var viewer;
  var viewerImage;
  var viewerTitle;
  var closeButton;
  var lastTrigger;

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
    closeButton = viewer.querySelector('.mobile-image-viewer__close');

    closeButton.addEventListener('click', closeViewer);
    viewer.addEventListener('click', function (event) {
      if (event.target === viewer) closeViewer();
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
    closeButton.focus();
  }

  function closeViewer() {
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
})();
