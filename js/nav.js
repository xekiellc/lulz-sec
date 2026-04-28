// lulz-sec.com — nav.js
// Shared navigation component — update once, applies everywhere

function mountNav() {
  const mount = document.getElementById('nav-mount');
  if (!mount) return;

  // Determine active page for highlighting
  const path = window.location.pathname;

  function isActive(href) {
    if (href === '/' && path === '/') return true;
    if (href !== '/' && path.includes(href.replace('.html', ''))) return true;
    return false;
  }

  function navLink(href, label, key) {
    const active = isActive(href) ? 'style="color:var(--g)"' : '';
    return `<a href="${href}" ${active}>${label}<span class="kb">[${key}]</span></a>`;
  }

  mount.innerHTML = `
    <nav>
      <div class="logo-wrap" onclick="window.location.href='/'">
        <div class="lg g1">LULZ<span style="color:var(--r)">-</span>SEC<span style="font-size:13px;color:var(--gd);font-family:var(--mono);font-weight:400;margin-left:3px;">.COM</span></div>
        <div class="lg g2">LULZ<span style="color:var(--r)">-</span>SEC<span style="font-size:13px;color:var(--gd);font-family:var(--mono);font-weight:400;margin-left:3px;">.COM</span></div>
        <div class="logo-main">LULZ<span class="dash">-</span>SEC<span class="tld">.COM</span></div>
      </div>
      <div class="nav-links">
        ${navLink('/zero-day.html', 'Zero Day', 'Z')}
        ${navLink('/archive.html', 'Archive', 'A')}
        ${navLink('/legends.html', 'Legends', 'L')}
        ${navLink('/foia.html', 'FOIA', 'F')}
        ${navLink('/white-hat.html', 'White Hat', 'W')}
        ${navLink('/media.html', 'Media', 'M')}
        ${navLink('/community.html', 'Community', 'C')}
      </div>
      <div class="nav-right">
        <div class="nav-search">
          <span style="color:var(--gm);font-size:11px;">/</span>
          <input type="text" placeholder="search the lulz..." />
        </div>
        <div class="nav-pgp">PGP &#9679;</div>
      </div>
    </nav>
  `;
}

// Mount immediately
mountNav();
