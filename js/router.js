  // ===== PATH ROUTER =====
  // The app's original pages are hash-routed sections (#listings, #calc …, see showPage in
  // utils.js). Pages that need their own shareable, SEO-indexable URL — /privacy, /optout,
  // /complexes, /complex/<id>, /hotlist, /valuation, /b/<budget-slug> — are path-routed
  // here instead. vercel.json rewrites every one of those paths to index.html; this file
  // then renders the matching view into the single #route section.
  //
  // Modules register their own routes with registerRoute(regex, handler) — handler(match)
  // returns { title, description, html } or a Promise of it, plus optional after() hook.

  const _routes = [];
  const SITE_ORIGIN = 'https://bairx.vercel.app';
  const DEFAULT_META = {
    title: 'BairX — Монголын Ухаалаг Үл Хөдлөх Платформ',
    description: 'Орон сууц, түрээс, газар, оффисын зар. Хотхон бүрийн 1 м²-ийн дундаж үнэ, хямд зарын жагсаалт, байраа үнэлүүлэх.'
  };

  function registerRoute(re, handler) { _routes.push({ re, handler }); }

  function matchRoute(path) {
    const clean = String(path || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    for (const r of _routes) {
      const m = clean.match(r.re);
      if (m) return { route: r, match: m, path: clean };
    }
    return null;
  }

  function setMeta(meta) {
    const m = Object.assign({}, DEFAULT_META, meta || {});
    document.title = m.title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
    desc.content = m.description;
    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
    canon.href = SITE_ORIGIN + (m.canonical || location.pathname);
  }

  // Returns true if `path` is a registered path route (and renders it), false otherwise.
  async function showRoute(path, opts) {
    const o = opts || {};
    const hit = matchRoute(path);
    if (!hit) return false;
    document.querySelectorAll('section').forEach(s => s.classList.remove('page-active'));
    const section = document.getElementById('route');
    const content = document.getElementById('routeContent');
    section.classList.add('page-active');
    document.body.classList.remove('admin-mode');
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const fullPath = String(path).split('#')[0];
    if (!o.fromPop && history.pushState && (location.pathname + location.search) !== fullPath) history.pushState(null, '', fullPath);
    window.scrollTo(0, 0);
    content.innerHTML = '<div class="route-loading"><div class="sk-line w40"></div><div class="sk-line w90"></div><div class="sk-line w60"></div></div>';
    try {
      const view = await hit.route.handler(hit.match);
      // A newer navigation may have happened while this one was loading.
      if (location.pathname.replace(/\/+$/, '') !== hit.path.replace(/\/+$/, '') && hit.path !== '/') return true;
      content.innerHTML = view.html;
      setMeta({ title: view.title, description: view.description, canonical: view.canonical || hit.path });
      if (typeof view.after === 'function') view.after();
    } catch (e) {
      console.error('route render failed:', e);
      content.innerHTML = '<div class="route-page"><h1 class="route-title">Алдаа гарлаа</h1><p>Хуудсыг ачаалж чадсангүй. Дахин оролдоно уу.</p></div>';
    }
    if (typeof trackEvent === 'function') trackEvent('page_view', { page: hit.path.slice(0, 60) });
    return true;
  }

  // In-app link handler: <a href="/complexes" onclick="return go(event, '/complexes')">
  function go(e, path) {
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return true; // let new-tab clicks through
    if (e) e.preventDefault();
    if (typeof closeModal === 'function' && document.getElementById('modal')?.classList.contains('open')) closeModal();
    const mm = document.getElementById('mobileMenu');
    if (mm) mm.classList.remove('open');
    showRoute(path);
    return false;
  }

  function resetMetaForHashPages() { setMeta({ canonical: '/' }); }
