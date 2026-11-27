  // ===== INIT =====
  checkExpiredListings();
  renderHomeListings();
  // Update filter pill counts
  updateCatPillCounts();
  calculate();
  renderNotifications();
  updateNotifCount();
  updateFilterCount();
  renderFilterTags();
  updateChatCount();
  updateFavCount();

  // Performance: these only fill pages that are hidden on first load (Listings, Rent,
  // Compare, Feed, Dashboard …). They run once when the browser is idle — or immediately,
  // the moment any of those pages is opened (showPage → runDeferredInit) or when the app
  // was opened directly on one of them — so the home page paints without that work.
  let _deferredInitDone = false;
  function runDeferredInit() {
    if (_deferredInitDone) return;
    _deferredInitDone = true;
    [() => renderListings(getFilteredListings()), () => renderRentListings('all'), calculateCompare, renderDemographics,
     renderFeed, renderViewsChart, renderMyListings, renderBuyerDocs].forEach(fn => {
      try { fn(); } catch (e) { console.error('deferred init failed:', e); }
    });
  }
  {
    const h = location.hash.replace('#', '');
    if (h && h !== 'home') runDeferredInit();
    else (window.requestIdleCallback || ((cb) => setTimeout(cb, 200)))(runDeferredInit, { timeout: 2000 });
  }
  loadPublicListings();
  applyDemoListingHides();
  loadProjects();
  renderAccountSidebar();
  renderSiteAds();
  if (typeof renderHomeMarket === 'function') renderHomeMarket();

  // Initialize page router + listing hash restore
  (function() {
    const hash = location.hash.replace('#', '');
    // Push / e-mail links from functions/index.js: /?l=<firestoreId>
    const linkedFsId = new URLSearchParams(location.search).get('l');
    if (linkedFsId) {
      history.replaceState(null, '', '/');
      setTimeout(() => openListingByFsId(linkedFsId), 200);
    }
    // Path routes (/privacy, /complexes, /b/250 …) take priority — see js/router.js.
    const alias = !location.hash && typeof pathAlias === 'function' ? pathAlias(location.pathname) : null;
    if (alias) {
      showPage(alias);
    } else if (location.pathname !== '/' && !location.hash && typeof showRoute === 'function' && matchRoute(location.pathname)) {
      showRoute(location.pathname + location.search, { fromPop: true });
    } else if (hash.startsWith('listing-')) {
      const id = parseInt(hash.replace('listing-', ''), 10);
      showPage('listings');
      if (!isNaN(id)) setTimeout(() => openListing(id), 100);
    } else if (hash === 'add') {
      showPage('home');
      setTimeout(() => openAddListing(), 100);
    } else {
      showPage(hash || 'home');
    }
    window.addEventListener('popstate', function() {
      const h = location.hash.replace('#', '');
      const a = !location.hash && typeof pathAlias === 'function' ? pathAlias(location.pathname) : null;
      if (a) {
        showPage(a);
      } else if (location.pathname !== '/' && !location.hash && typeof showRoute === 'function' && matchRoute(location.pathname)) {
        showRoute(location.pathname + location.search, { fromPop: true });
      } else if (h.startsWith('listing-')) {
        const id = parseInt(h.replace('listing-', ''), 10);
        showPage('listings');
        if (!isNaN(id)) setTimeout(() => openListing(id), 100);
      } else if (h === 'add') {
        showPage('home');
        setTimeout(() => openAddListing(), 100);
      } else {
        showPage(h || 'home');
      }
    });
  })();

  // PWA — Service Worker
  // Update mechanism: sw.js is served with Cache-Control: no-cache (vercel.json), the browser
  // re-checks it on every load and once an hour; a new worker activates immediately
  // (skipWaiting + clients.claim in sw.js) and deletes the old versioned cache. When that
  // happens on an already-open tab, offer a reload so the page's JS matches the new worker.
  // Bump CACHE in sw.js on every release that changes cached assets.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('/sw.js').then(function(reg) {
        setInterval(function() { reg.update().catch(function() {}); }, 60 * 60 * 1000);
      }).catch(function() {});
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (!hadController || window._bairxSwReloadOffered) return;
        window._bairxSwReloadOffered = true;
        const t = document.getElementById('toast');
        if (!t) return;
        t.innerHTML = 'BairX шинэчлэгдлээ. <a href="javascript:location.reload()" style="color:#fff;text-decoration:underline;font-weight:700;">Дахин ачаалах</a>';
        t.classList.add('show');
        setTimeout(function() { t.classList.remove('show'); }, 12000);
      });
    });
  }

  // PWA — Install prompt
  let _pwaPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    _pwaPrompt = e;
    var banner = document.getElementById('pwaBanner');
    if (banner) banner.style.display = 'flex';
  });
  window.addEventListener('appinstalled', function() {
    var banner = document.getElementById('pwaBanner');
    if (banner) banner.style.display = 'none';
    _pwaPrompt = null;
    showToast('BairX амжилттай суулгагдлаа!', 'success');
  });

  function pwaInstall() {
    if (!_pwaPrompt) return;
    _pwaPrompt.prompt();
    _pwaPrompt.userChoice.then(function(r) {
      if (r.outcome === 'accepted') {
        var banner = document.getElementById('pwaBanner');
        if (banner) banner.style.display = 'none';
      }
      _pwaPrompt = null;
    });
  }
  function pwaDismiss() {
    var banner = document.getElementById('pwaBanner');
    if (banner) banner.style.display = 'none';
  }
