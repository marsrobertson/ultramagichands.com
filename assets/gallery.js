(function () {
  var photos = window.GALLERY_PHOTOS || [];
  var preview = document.getElementById('photo-preview');
  function photoImage(photo) {
    var img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.alt;
    img.width = photo.w;
    img.height = photo.h;
    img.loading = 'lazy';
    img.decoding = 'async';
    return img;
  }
  if (preview && photos.length) {
    document.getElementById('photos').hidden = false;
    photos.slice(0, 6).forEach(function (photo, index) {
      var link = document.createElement('a');
      link.href = 'gallery.html#photo-' + (index + 1);
      link.appendChild(photoImage(photo));
      preview.appendChild(link);
    });
    // The first real gallery photo becomes the homepage's lead image.
    var lead = document.querySelector('.hero-picture img');
    if (lead) {
      lead.src = photos[0].src;
      lead.alt = photos[0].alt;
      lead.width = photos[0].w;
      lead.height = photos[0].h;
      document.querySelector('.hero-picture figcaption').textContent = photos[0].caption;
    }
  }
  var grid = document.getElementById('photo-grid');
  if (!grid || !photos.length) return;
  document.getElementById('gallery-empty').hidden = true;
  var viewer = document.getElementById('photo-viewer');
  var full = document.getElementById('photo-full');
  var caption = document.getElementById('photo-caption');
  var counter = document.getElementById('photo-counter');
  var current = 0;
  var previousOverflow = '';
  function show(index) {
    current = (index + photos.length) % photos.length;
    var photo = photos[current];
    full.src = photo.src;
    full.alt = photo.alt;
    caption.textContent = photo.caption;
    caption.hidden = !photo.caption;
    counter.textContent = (current + 1) + ' / ' + photos.length;
  }
  function open(index) {
    show(index);
    if (!viewer.open) {
      previousOverflow = document.body.style.overflow;
      viewer.showModal();
      document.body.style.overflow = 'hidden';
    }
  }
  photos.forEach(function (photo, index) {
    var figure = document.createElement('figure');
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-tile';
    button.setAttribute('aria-label', 'Open photo ' + (index + 1) + ': ' + photo.alt);
    button.appendChild(photoImage(photo));
    button.addEventListener('click', function () { open(index); });
    figure.appendChild(button);
    if (photo.caption) {
      var label = document.createElement('figcaption');
      label.textContent = photo.caption;
      figure.appendChild(label);
    }
    grid.appendChild(figure);
  });
  document.getElementById('photo-close').addEventListener('click', function () { viewer.close(); });
  document.getElementById('photo-previous').addEventListener('click', function () { show(current - 1); });
  document.getElementById('photo-next').addEventListener('click', function () { show(current + 1); });
  document.getElementById('photo-previous').hidden = photos.length < 2;
  document.getElementById('photo-next').hidden = photos.length < 2;
  viewer.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  viewer.addEventListener('click', function (event) { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', function () {
    document.body.style.overflow = previousOverflow;
    full.removeAttribute('src');
  });
  var start = null;
  full.draggable = false;
  full.addEventListener('pointerdown', function (event) {
    start = { x: event.clientX, y: event.clientY };
    full.setPointerCapture(event.pointerId);
  });
  full.addEventListener('pointerup', function (event) {
    if (!start) return;
    var distance = event.clientX - start.x;
    if (Math.abs(distance) > 50 && Math.abs(distance) > Math.abs(event.clientY - start.y)) show(current + (distance < 0 ? 1 : -1));
    start = null;
  });
  full.addEventListener('pointercancel', function () { start = null; });
  var linkedPhoto = /^#photo-(\d+)$/.exec(window.location.hash);
  if (linkedPhoto && Number(linkedPhoto[1]) >= 1 && Number(linkedPhoto[1]) <= photos.length) open(Number(linkedPhoto[1]) - 1);
})();
