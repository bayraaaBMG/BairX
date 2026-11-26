  // ===== INIT =====
  checkExpiredListings();
  renderListings(listings);
  renderHomeListings();
  // Update filter pill counts
  updateCatPillCounts();
  calculate();
  renderRentListings('all');
  calculateCompare();
  renderDemographics();
  renderFeed();
  renderNotifications();
  updateNotifCount();
  renderViewsChart();
  updateFilterCount();
  renderFilterTags();
  updateChatCount();
  updateFavCount();
  renderMyListings();
  renderBuyerDocs();
  loadPublicListings();
  applyDemoListingHides();
  loadProjects();
  renderAccountSidebar();
  renderSiteAds();

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
    if (location.pathname !== '/' && !location.hash && typeof showRoute === 'function' && matchRoute(location.pathname)) {
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
      if (location.pathname !== '/' && !location.hash && typeof showRoute === 'function' && matchRoute(location.pathname)) {
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
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').catch(function() {});
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
