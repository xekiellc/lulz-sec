const axios = require('axios');
const RSSParser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new RSSParser();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// ─── RSS FEEDS ────────────────────────────────────────────────────────────────
const RSS_FEEDS = [
  { url: 'https://krebsonsecurity.com/feed/', source: 'Krebs on Security' },
  { url: 'https://www.eff.org/rss/updates.xml', source: 'EFF' },
  { url: 'https://feeds.arstechnica.com/arstechnica/security', source: 'Ars Technica' },
  { url: 'https://www.darkreading.com/rss.xml', source: 'Dark Reading' },
  { url: 'https://theintercept.com/feed/?rss', source: 'The Intercept' },
  { url: 'https://www.theregister.com/security/headlines.atom', source: 'The Register' },
  { url: 'https://feeds.feedburner.com/TheHackersNews', source: 'The Hacker News' },
];

// ─── NEWSAPI QUERIES ──────────────────────────────────────────────────────────
const NEWS_QUERIES = [
  'zero day vulnerability',
  'data breach hacker',
  'cybersecurity exploit CVE',
  'FOIA government transparency',
  'Snowden Assange whistleblower',
  'ethical hacking bug bounty',
];

// ─── FETCH RSS ────────────────────────────────────────────────────────────────
async function fetchRSS() {
  const articles = [];
  for (const feed of RSS_FEEDS) {
    try {
      const result = await parser.parseURL(feed.url);
      const items = result.items.slice(0, 5).map(item => ({
        title: item.title?.trim(),
        url: item.link,
        description: item.contentSnippet?.slice(0, 300) || item.summary?.slice(0, 300) || '',
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        source: feed.source,
      }));
      articles.push(...items);
      console.log(`✓ ${feed.source}: ${items.length} articles`);
    } catch (err) {
      console.log(`✗ ${feed.source}: ${err.message}`);
    }
  }
  return articles;
}

// ─── FETCH NEWSAPI ────────────────────────────────────────────────────────────
async function fetchNewsAPI() {
  const articles = [];
  for (const query of NEWS_QUERIES) {
    try {
      const res = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          sortBy: 'publishedAt',
          pageSize: 5,
          language: 'en',
          apiKey: NEWS_API_KEY,
        }
      });
      const items = (res.data.articles || [])
        .filter(a => a.title && a.url && !a.title.includes('[Removed]'))
        .map(a => ({
          title: a.title?.trim(),
          url: a.url,
          description: a.description?.slice(0, 300) || '',
          publishedAt: a.publishedAt,
          source: a.source?.name || 'NewsAPI',
        }));
      articles.push(...items);
      console.log(`✓ NewsAPI "${query}": ${items.length} articles`);
    } catch (err) {
      console.log(`✗ NewsAPI "${query}": ${err.message}`);
    }
  }
  return articles;
}

// ─── DEDUPLICATE ──────────────────────────────────────────────────────────────
function deduplicate(articles) {
  const seen = new Set();
  return articles.filter(a => {
    const key = a.title?.toLowerCase().slice(0, 60);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── CLAUDE CURATION ─────────────────────────────────────────────────────────
async function curateWithClaude(articles) {
  const articleList = articles.slice(0, 40).map((a, i) =>
    `${i + 1}. TITLE: ${a.title}\n   SOURCE: ${a.source}\n   DESC: ${a.description}`
  ).join('\n\n');

  const prompt = `You are the editorial AI for lulz-sec.com — a legal tribute site honoring LulzSec, whistleblowers, and digital freedom fighters. Your voice is that of a brilliant, slightly unhinged security researcher who is angry at the right things and occasionally hilarious.

Here are ${Math.min(articles.length, 40)} articles. Select the 10 most relevant and important ones for our audience. Prioritize:
1. Zero-day vulnerabilities and CVE disclosures
2. Data breaches — especially where responsible disclosure was ignored
3. FOIA wins and government transparency
4. Digital rights, surveillance, press freedom
5. Whistleblower news (Snowden, Assange, Manning, Hammond)
6. White hat community — bug bounties, ethical hacking
7. LulzSec history or hacker culture

For each selected article return a JSON object with:
- index: the article number from the list
- category: one of "ZERO DAY", "BREACH", "FOIA", "RIGHTS", "LEGENDS", "WHITE HAT", "ARCHIVE"
- summary: a 1-2 sentence summary in lulz-sec editorial voice — irreverent, informed, occasionally funny. Never boring.

Return ONLY a valid JSON array of 10 objects. No markdown, no explanation, just the JSON array.

ARTICLES:
${articleList}`;

  try {
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      }
    });

    const text = res.data.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const selected = JSON.parse(clean);
    console.log(`✓ Claude selected ${selected.length} articles`);
    return selected;
  } catch (err) {
    console.log(`✗ Claude curation failed: ${err.message}`);
    // Fallback — return first 10 articles uncurated
    return articles.slice(0, 10).map((a, i) => ({
      index: i,
      category: 'NEWS',
      summary: a.description || '',
    }));
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔄 Starting lulz-sec feed refresh...');

  // Fetch from all sources
  const [rssArticles, newsArticles] = await Promise.all([
    fetchRSS(),
    fetchNewsAPI(),
  ]);

  const allArticles = deduplicate([...rssArticles, ...newsArticles]);
  console.log(`📰 Total unique articles: ${allArticles.length}`);

  // Claude curation
  const curated = await curateWithClaude(allArticles);

  // Build final feed
  const feed = {
    last_updated: new Date().toISOString(),
    articles: curated.map(item => {
      const source = allArticles[item.index] || allArticles[0];
      return {
        title: source.title,
        url: source.url,
        source: source.source,
        publishedAt: source.publishedAt,
        category: item.category,
        summary: item.summary,
      };
    }).filter(a => a.title && a.url),
  };

  // Write to file
  const outPath = path.join(__dirname, '..', 'data', 'feed.json');
  fs.writeFileSync(outPath, JSON.stringify(feed, null, 2));
  console.log(`✅ Feed written: ${feed.articles.length} articles`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
