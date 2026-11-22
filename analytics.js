/* Haus of Jess analytics
   - Google Analytics 4: traffic, location, sources, pages, engagement, events, funnels
   - Microsoft Clarity: heatmaps, scroll maps, session recordings, rage clicks, exits
   Paste the two IDs below. Nothing loads until an ID is present, and nothing loads
   anywhere except on hausofjess.com, so previews never pollute the data. */
(function () {
  var GTAG_ID = 'GTM-5BKBRF83'; // Google tag from the GA4 data stream (Haus of Jess)
  var GA_ID = '';       // optional G- Measurement ID, only if the Google tag above is not used
  var CLARITY_ID = 'zht6q9nhal';  // Microsoft Clarity project (Haus of Jess)

  var live = /(^|\.)hausofjess\.com$/i.test(location.hostname);
  var page = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  if (live && GTAG_ID) {
    var gt = document.createElement('script');
    gt.async = true;
    gt.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTAG_ID;
    document.head.appendChild(gt);
    gtag('js', new Date());
  } else if (live && GA_ID) {
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(g);
    gtag('js', new Date());
    gtag('config', GA_ID);
  }
  if (live && CLARITY_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
  }

  // One call sends an event to both tools.
  function track(name, params) {
    params = params || {};
    params.page = params.page || page;
    if (!live) { try { console.debug('[analytics]', name, params); } catch (e) {} return; }
    try { if (GTAG_ID || GA_ID) window.gtag('event', name, params); } catch (e) {}
    try { if (CLARITY_ID && window.clarity) window.clarity('event', name); } catch (e) {}
  }
  function tag(key, value) {
    try { if (live && CLARITY_ID && window.clarity) window.clarity('set', key, String(value)); } catch (e) {}
  }
  window.hjTrack = track;

  function text(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : ''; }

  // ---- Scroll depth ----
  var marks = [25, 50, 75, 90], hit = {};
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    if (max <= 0) return;
    var pct = Math.round((h.scrollTop || document.body.scrollTop) / max * 100);
    marks.forEach(function (m) { if (pct >= m && !hit[m]) { hit[m] = 1; track('scroll_depth', { percent: m }); } });
  }
  addEventListener('scroll', onScroll, { passive: true });

  // ---- Which sections people actually reach ----
  function watchSections() {
    if (!('IntersectionObserver' in window)) return;
    var seen = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, id = el.id || (el.querySelector('h1,h2,h3,h4') && text(el.querySelector('h1,h2,h3,h4')));
        if (!id || seen[id]) return;
        seen[id] = 1;
        track(el.classList.contains('post') ? 'note_view' : 'section_view', { section: id });
        tag('last_section', id);
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('section, article.post, .res, .rooms, main > section, main > .p').forEach(function (s) { io.observe(s); });
  }

  // ---- Compounding Test funnel ----
  var pillars = ['People', 'Brand', 'Strategy', 'Operations', 'Financial Flexibility', 'Leadership'];
  var answered = {}, started = false, completed = false;
  function testClick(btn) {
    var m = /^b(\d)(\d)$/.exec(btn.id || '');
    if (!m) return;
    var i = +m[1], v = +m[2];
    if (!started) { started = true; track('test_start', { first_pillar: pillars[i] }); }
    var isNew = !answered[i];
    answered[i] = v;
    var n = Object.keys(answered).length;
    track('test_score', { pillar: pillars[i], score: v, answered: n, changed: !isNew });
    tag('test_answered', n);
    if (n === 6 && !completed) {
      completed = true;
      setTimeout(function () {
        track('test_complete', { result: text(document.getElementById('tot')), band: text(document.getElementById('band')), weakest: text(document.getElementById('wp')) });
        tag('test_band', text(document.getElementById('band')));
      }, 50);
    }
  }
  function leaving() {
    if (started && !completed) {
      var n = Object.keys(answered).length, last = pillars[Math.max.apply(null, Object.keys(answered).map(Number))];
      track('test_abandon', { answered: n, last_pillar: last, transport_type: 'beacon' });
      started = false;
    }
  }
  addEventListener('pagehide', leaving);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') leaving(); });

  // ---- Every meaningful click, by delegation ----
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target : e.target.parentElement;
    if (!t || !t.closest) return;
    var el;
    if ((el = t.closest('.fw-p, .fw-dot, .fw-next, .fw-prev'))) {
      var how = el.classList.contains('fw-p') ? 'wheel' : el.classList.contains('fw-dot') ? 'dot' : el.classList.contains('fw-next') ? 'next' : 'previous';
      setTimeout(function () { track('flywheel_select', { pillar: text(document.querySelector('.fw-name')), method: how }); }, 30);
      return;
    }
    if ((el = t.closest('.pcard .more'))) {
      var card = el.closest('.pcard');
      setTimeout(function () { track(card.classList.contains('open') ? 'practice_open' : 'practice_close', { card: text(card.querySelector('h4')) }); }, 30);
      return;
    }
    if ((el = t.closest('.expand-all'))) { track('practice_expand_all'); return; }
    if ((el = t.closest('.deck-nav button'))) { track('card_dot', { deck: el.closest('section') && el.closest('section').id }); return; }
    if ((el = t.closest('button[id^="b"]')) && /^b\d\d$/.test(el.id)) { testClick(el); return; }
    if ((el = t.closest('#cta'))) { track('test_cta_click', { weakest: text(document.getElementById('wp')) }); return; }
    if ((el = t.closest('.chip'))) { track('note_filter', { filter: el.dataset.f }); return; }
    if ((el = t.closest('.cp'))) { track('note_copy_link', { note: el.dataset.s }); return; }
    if ((el = t.closest('a.li'))) { track('note_share_linkedin', { note: el.dataset.s }); return; }
    if ((el = t.closest('a[href^="mailto:"]'))) {
      var sec = el.closest('section, article, .res, footer, .take');
      track('contact_click', { location: (sec && (sec.id || sec.className)) || 'page', label: text(el) });
      tag('contacted', 'yes');
      return;
    }
    if ((el = t.closest('.topnav a, .tn-up'))) { track('nav_click', { label: text(el) || el.getAttribute('aria-label') }); return; }
    if ((el = t.closest('a[href^="http"]')) && el.hostname !== location.hostname) { track('outbound_click', { url: el.href.slice(0, 100) }); return; }
    if ((el = t.closest('a.btn, a.ctab'))) { track('button_click', { label: text(el) }); return; }
    if ((el = t.closest('details summary'))) { track('expand_detail', { label: text(el) }); return; }
    if ((el = t.closest('button'))) { track('button_click', { label: text(el) || el.getAttribute('aria-label') || '' }); }
  }, true);

  // ---- Swipes on phone card decks (first swipe per deck) ----
  function watchDecks() {
    document.querySelectorAll('[data-deck]').forEach(function (d) {
      var done = false;
      d.addEventListener('scroll', function () {
        if (done || d.scrollLeft < 40) return;
        done = true;
        track('card_swipe', { deck: (d.closest('section') && d.closest('section').id) || 'deck' });
      }, { passive: true });
    });
  }

  function init() { watchSections(); watchDecks(); tag('page', page); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
