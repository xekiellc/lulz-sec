// lulz-sec.com — main.js
// keyboard shortcuts, easter egg, utilities

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Don't fire if user is typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  switch(e.key.toLowerCase()) {
    case 'z': window.location.href = '/zero-day.html'; break;
    case 'a': window.location.href = '/archive.html'; break;
    case 'l': window.location.href = '/legends.html'; break;
    case 'f': window.location.href = '/foia.html'; break;
    case 'w': window.location.href = '/white-hat.html'; break;
    case 'c': window.location.href = '/community.html'; break;
    case '/':
      e.preventDefault();
      document.querySelector('.nav-search input')?.focus();
      break;
  }
});

// ─── MASCOT EASTER EGG ────────────────────────────────────────────────────────
const quotes = [
  '"Laughing at your security since 2011."',
  '"We do things because we find it entertaining."',
  '"You cannot arrest an idea." — Topiary',
  '"The internet never forgot."',
  '"50 days. 7 hackers. 0 ideas arrested."',
  '"We have joy, we have fun, we have messed up everyone."',
  '"We spent $0 until people started giving us donations." — Topiary',
  '"Lulz is a corruption of LOL." — LulzSec press release',
];

let quoteIndex = 0;
const mascotWrap = document.querySelector('.mascot-wrap');
const mascotTip = document.getElementById('mascot-tip');

if (mascotWrap && mascotTip) {
  mascotWrap.addEventListener('mouseenter', () => {
    mascotTip.textContent = quotes[quoteIndex % quotes.length];
    quoteIndex++;
  });
}

// ─── DAYS COUNTER ─────────────────────────────────────────────────────────────
const daysEl = document.getElementById('days-count');
if (daysEl) {
  const start = new Date('2011-06-01');
  const now = new Date();
  const days = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  daysEl.textContent = days.toLocaleString();
}

// ─── FEED RENDERER ────────────────────────────────────────────────────────────
async function loadFeed() {
  const feedContainer = document.getElementById('feed-container');
  if (!feedContainer) return;

  try {
    const res = await fetch('/data/feed.json');
    const data = await res.json();

    if (!data.articles || data.articles.length === 0) {
      feedContainer.innerHTML = '<div class="fi"><div class="fi-body"><div class="fi-hed">Feed loading...</div><div class="fi-meta">Check back shortly — pipeline runs 4x daily.</div></div></div>';
      return;
    }

    // First article is the lead story
    const lead = data.articles[0];
    const rest = data.articles.slice(1, 6);

    const tagClass = getTagClass(lead.category);
    const tagLabel = lead.category || 'NEWS';

    let html = `
      <div class="lead" onclick="window.open('${lead.url}','_blank')">
        <div class="lead-tag ${tagClass}">${tagLabel}</div>
        <div class="lead-hed">${lead.title}</div>
        <div class="lead-deck">${lead.summary || lead.description || ''}</div>
        <div class="lead-meta"><span>${timeAgo(lead.publishedAt)}</span>${lead.source || ''}</div>
      </div>
    `;

    rest.forEach(article => {
      const tc = getTagClass(article.category);
      const tl = article.category || 'NEWS';
      html += `
        <div class="fi" onclick="window.open('${article.url}','_blank')">
          <div class="fi-tag ${tc}">${tl}</div>
          <div class="fi-body">
            <div class="fi-hed">${article.title}</div>
            <div class="fi-meta"><span>${timeAgo(article.publishedAt)}</span>${article.source || ''}</div>
          </div>
        </div>
      `;
    });

    feedContainer.innerHTML = html;
  } catch(err) {
    console.log('Feed not ready yet:', err);
  }
}

function getTagClass(category) {
  const map = {
    'ZERO DAY': 't-zd', 'CVE': 't-zd',
    'FOIA': 't-fo', 'TRANSPARENCY': 't-fo',
    'BREACH': 't-br', 'HACK': 't-br',
    'RIGHTS': 't-fr', 'FREEDOM': 't-fr',
    'COMMUNITY': 't-cm', 'ARCHIVE': 't-cm',
    'WHITE HAT': 't-wh', 'BOUNTY': 't-wh',
  };
  return map[category?.toUpperCase()] || 't-fr';
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
  return then.toLocaleDateString();
}

// ─── TICKER LOADER ────────────────────────────────────────────────────────────
async function loadTicker() {
  const tickerInner = document.querySelector('.ticker-inner');
  if (!tickerInner) return;

  try {
    const res = await fetch('/data/feed.json');
    const data = await res.json();
    if (!data.articles || data.articles.length === 0) return;

    // Build ticker from top 8 articles, duplicated for seamless scroll
    const items = data.articles.slice(0, 8);
    const tickerHTML = [...items, ...items].map(a => {
      const pill = getCategoryPill(a.category);
      return `<div class="ti">${pill}${a.title}</div>`;
    }).join('');

    tickerInner.innerHTML = tickerHTML;
  } catch(err) {
    console.log('Ticker not ready:', err);
  }
}

function getCategoryPill(category) {
  const map = {
    'ZERO DAY': 'tp-cve', 'CVE': 'tp-cve',
    'FOIA': 'tp-foia', 'TRANSPARENCY': 'tp-foia',
    'BREACH': 'tp-breach', 'HACK': 'tp-breach',
    'EXILE': 'tp-exile', 'LEGENDS': 'tp-exile',
    'LULZ': 'tp-lulz', 'ARCHIVE': 'tp-lulz',
  };
  const cls = map[category?.toUpperCase()] || 'tp-lulz';
  const label = category || 'NEWS';
  return `<span class="ti-pill ${cls}">${label}</span>`;
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadFeed();
  loadTicker();
});
