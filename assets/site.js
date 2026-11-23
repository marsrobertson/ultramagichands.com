(function () {
  // WhatsApp links: add a pre-filled message from data-msg.
  document.querySelectorAll('.js-wa').forEach(function (a) {
    var msg = a.getAttribute('data-msg');
    if (msg) a.href = a.href.split('?')[0] + '?text=' + encodeURIComponent(msg);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // Nav background + floating button once past the hero.
  var nav = document.querySelector('.nav');
  var fab = document.querySelector('.fab');
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    if (fab) fab.classList.toggle('show', y > window.innerHeight * 0.8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Recycle cards only beyond the viewport; visible reviews never change.
  var reviews = window.REVIEWS || [];
  var wall = document.getElementById('collage');
  if (!wall) return;
  if (window.REVIEWS_MAPS_URL) {
    document.querySelectorAll('.js-maps').forEach(function (a) { a.href = window.REVIEWS_MAPS_URL; });
  }
  function reviewCard(r) {
    var card = document.createElement('article');
    card.className = 'review-card';
    var img = document.createElement('img');
    img.src = 'reviews/' + r.src;
    img.width = r.w;
    img.height = r.h;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = 'Google Maps review by ' + (r.reviewer || 'a customer');
    card.appendChild(img);
    var hint = document.createElement('a');
    hint.className = 'review-card-hint';
    hint.textContent = '🔗';
    hint.href = r.link || document.querySelector('.js-maps').href;
    hint.target = '_blank';
    hint.rel = 'noopener';
    hint.setAttribute('aria-label', 'Read original review by ' + r.reviewer);
    card.appendChild(hint);
    img.draggable = false;
    return card;
  }
  function shuffled(items) {
    var result = items.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = result[i]; result[i] = result[j]; result[j] = temp;
    }
    return result;
  }
  var rivers = [];
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var inView = true;
  if (reviews.length) {
    var mixed = shuffled(reviews);
    var lane = document.createElement('div');
    lane.className = 'review-lane';
    var track = document.createElement('div');
    track.className = 'review-track';
    var columns = [];
    for (var i = 0; i < Math.ceil(mixed.length / 3); i++) {
      var column = document.createElement('div');
      column.className = 'review-column';
      columns.push({ element: column, height: 0 });
      track.appendChild(column);
    }
    mixed.forEach(function (r) {
      var shortest = columns.reduce(function (a, b) { return a.height <= b.height ? a : b; });
      shortest.element.appendChild(reviewCard(r));
      shortest.height += r.h / r.w * 320 + 28;
    });
    var newsletter = document.createElement('aside');
    newsletter.className = 'review-card newsletter-card';
    newsletter.innerHTML = '<span class="newsletter-icon" aria-hidden="true">💌</span>' +
      '<p class="eyebrow">More good energy</p><h3>A little magic<br>in your inbox.</h3>' +
      '<p>Sign up to our newsletter.</p><span class="newsletter-placeholder">Email signup · Coming soon</span>';
    var signupColumn = document.createElement('div');
    signupColumn.className = 'review-column newsletter-column';
    signupColumn.appendChild(newsletter);
    track.insertBefore(signupColumn, columns[2].element);
    lane.appendChild(track);
    wall.appendChild(lane);
    rivers.push({ lane: lane, track: track, offset: 0, speed: 23 });
    wall.hidden = false;
    document.getElementById('quotes').hidden = true;
    // Reserve each row's tallest tile so recycling cannot move other content.
    function sizeRivers() {
      rivers.forEach(function (river) {
        river.track.style.transform = '';
        river.lane.style.height = Math.ceil(Math.max.apply(null,
          Array.from(river.track.children).filter(function (column) { return !column.classList.contains('newsletter-column'); }).map(function (column) { return column.offsetHeight; }))) + 4 + 'px';
        signupColumn.style.height = river.lane.style.height;
        if (motion.matches) river.offset = 0;
        river.track.style.transform = 'translateX(-' + river.offset + 'px)';
      });
    }
    sizeRivers();
    window.addEventListener('resize', sizeRivers);
    motion.addEventListener('change', sizeRivers);
    new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; }).observe(wall);
    function moveRiver(river, distance) {
      var stride = river.track.firstElementChild.offsetWidth + 10;
      river.offset += distance;
      while (river.offset >= stride) {
        river.offset -= stride;
        var departed = river.track.firstElementChild;
        river.track.removeChild(departed);
        // Only reshuffle a column once it has completely left the screen.
        shuffled(Array.from(departed.children)).forEach(function (card) { departed.appendChild(card); });
        var firstHidden = Math.ceil((river.lane.clientWidth + river.offset) / stride) + 1;
        var index = firstHidden + Math.floor(Math.random() * Math.max(1, river.track.children.length - firstHidden + 1));
        river.track.insertBefore(departed, river.track.children[index] || null);
      }
      while (river.offset < 0) {
        river.track.insertBefore(river.track.lastElementChild, river.track.firstElementChild);
        river.offset += stride;
      }
      river.track.style.transform = 'translateX(-' + river.offset + 'px)';
    }
    var drag = null;
    var suppressClick = false;
    wall.addEventListener('pointerdown', function (e) {
      if (!e.isPrimary || e.button !== 0) return;
      drag = { id: e.pointerId, startX: e.clientX, lastX: e.clientX, startY: e.clientY, active: false };
      suppressClick = false;
    });
    wall.addEventListener('pointermove', function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      if (!drag.active) {
        if (Math.abs(e.clientY - drag.startY) > Math.abs(e.clientX - drag.startX) && Math.abs(e.clientY - drag.startY) > 6) { drag = null; return; }
        if (Math.abs(e.clientX - drag.startX) < 6) return;
        drag.active = true;
        suppressClick = true;
        wall.setPointerCapture(e.pointerId);
        wall.classList.add('is-dragging');
      }
      var distance = drag.lastX - e.clientX;
      if (motion.matches) lane.scrollLeft += distance;
      else rivers.forEach(function (river) { moveRiver(river, distance); });
      drag.lastX = e.clientX;
    });
    function endDrag() { drag = null; wall.classList.remove('is-dragging'); }
    wall.addEventListener('pointerup', endDrag);
    wall.addEventListener('pointercancel', endDrag);
    wall.addEventListener('lostpointercapture', endDrag);
    wall.addEventListener('click', function (e) {
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); suppressClick = false; }
    }, true);
    wall.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var previousTime;
    function drift(time) {
      var elapsed = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
      previousTime = time;
      var paused = motion.matches || !inView || document.hidden || drag ||
        wall.matches(':hover, :focus-within');
      if (!paused) rivers.forEach(function (river) { moveRiver(river, elapsed * river.speed); });
      requestAnimationFrame(drift);
    }
    requestAnimationFrame(drift);
  }
})();
