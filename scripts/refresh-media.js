const axios = require('axios');
const RSSParser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new RSSParser();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ─── PODCAST RSS FEEDS ────────────────────────────────────────────────────────
const PODCAST_FEEDS = [
  {
    url: 'https://darknetdiaries.com/feed/podcast',
    name: 'Darknet Diaries',
    host: 'Jack Rhysider',
    category: 'HACKING',
  },
  {
    url: 'https://malicious.life/feed/podcast',
    name: 'Malicious Life',
    host: 'Ran Levi',
    category: 'HACKING',
  },
  {
    url: 'https://feeds.megaphone.fm/risky-business',
    name: 'Risky Business',
    host: 'Patrick Gray',
    category: 'ZERO DAY',
  },
  {
    url: 'https://feeds.megaphone.fm/cyberwire-daily',
    name: 'CyberWire Daily',
    host: 'Dave Bittner',
    category: 'ZERO DAY',
  },
  {
    url: 'https://www.smashingsecurity.com/feed/podcast',
    name: 'Smashing Security',
    host: 'Graham Cluley',
    category: 'HACKING',
  },
  {
    url: 'https://hackervalley.com/feed/podcast',
    name: 'Hacker Valley Studio',
    host: 'Ron Eddings',
    category: 'WHITE HAT',
  },
  {
    url: 'https://feeds.buzzsprout.com/1142962.rss',
    name: 'Adopting Zero Trust',
    host: 'Various',
    category: 'WHITE HAT',
  },
];

// ─── CURATED STATIC MEDIA ─────────────────────────────────────────────────────
// These are the evergreen items — always in the library
const CURATED_MEDIA = [
  {
    type: 'youtube',
    category: 'LULZSEC',
    title: 'Sabu: The Rise and Reflections of LulzSec\'s Leader',
    description: 'Hector Monsegur (Sabu) in depth — from hacktivism to white hat. His most comprehensive interview. Essential listening for anyone who wants to understand LulzSec from the inside.',
    source: 'BeyondTrust Podcast',
    url: 'https://www.beyondtrust.com/podcast/ep-50-the-rise-and-reflections-of-sabu-hector-monsegur',
    year: '2025',
    duration: '58 min',
  },
  {
    type: 'podcast',
    category: 'LULZSEC',
    title: 'From Hacktivist to White Hat — Sabu Interview',
    description: 'Monsegur on founding LulzSec, the FBI turn, and his pen testing career. The story of how the most wanted hacker in America became one of its most effective security researchers.',
    source: 'Adopting Zero Trust',
    url: 'https://podcasts.apple.com/us/podcast/from-hacktivist-to-white-hat-hacker-a-chat-with/id1633461773?i=1000637027399',
    year: '2023',
    duration: '56 min',
  },
  {
    type: 'podcast',
    category: 'LULZSEC',
    title: 'What It\'s Like to Fight LulzSec',
    description: 'The law enforcement side of the 50 Days — told by the people who chased LulzSec across the internet in real time. Malicious Life at its best.',
    source: 'Malicious Life',
    url: 'https://www.cybereason.com/blog/malicious-life-podcast-what-its-like-to-fight-lulzsec',
    year: '2022',
    duration: '45 min',
  },
  {
    type: 'youtube',
    category: 'LEGENDS',
    title: 'Edward Snowden — Joe Rogan Experience #1368',
    description: 'Nearly 3 hours. NSA mass surveillance, PRISM, life in exile, and why he still believes it was worth it. The most-watched Snowden interview ever. 10M+ views.',
    source: 'Joe Rogan Experience',
    url: 'https://open.spotify.com/episode/7MaJD5vZsNSNrKQVEk5gbD',
    year: '2019',
    duration: '2h 45m',
  },
  {
    type: 'youtube',
    category: 'LEGENDS',
    title: 'Julian Assange and the Dark Secrets of War — DW Documentary 4K',
    description: 'Full documentary post-release. WikiLeaks, Collateral Murder, the Belmarsh years, and what his freedom actually means for press freedom globally.',
    source: 'DW Documentary',
    url: 'https://www.youtube.com/watch?v=PYIyq6tpQ-4',
    year: '2024',
    duration: '42 min',
  },
  {
    type: 'youtube',
    category: 'LEGENDS',
    title: 'The Internet\'s Own Boy — Aaron Swartz Documentary',
    description: 'The definitive film about Aaron Swartz. Free on YouTube. If you watch one thing on this list, make it this. 26 years old. Facing 35 years. Gone too soon.',
    source: 'YouTube — Free',
    url: 'https://www.youtube.com/watch?v=9vz06QO3UkQ',
    year: '2014',
    duration: '1h 45m',
  },
  {
    type: 'youtube',
    category: 'WHITE HAT',
    title: 'DEF CON Conference Talks — Full Archive',
    description: 'Free recordings of the world\'s most important hacker conference going back decades. Elite research, zero-day disclosures, and the culture that produced LulzSec.',
    source: 'DEF CON — YouTube',
    url: 'https://www.youtube.com/@DEFCONConference',
    year: 'Ongoing',
    duration: 'Archive',
  },
  {
    type: 'youtube',
    category: 'WHITE HAT',
    title: 'The Cyber Mentor — Ethical Hacking Full Course',
    description: 'Heath Adams. The best free ethical hacking course on YouTube. Beginner to advanced. OSCP prep, web app testing, career advice. 1M+ subscribers.',
    source: 'The Cyber Mentor — YouTube',
    url: 'https://www.youtube.com/@TCMSecurityAcademy',
    year: 'Ongoing',
    duration: 'Full course',
  },
  {
    type: 'article',
    category: 'LULZSEC',
    title: 'A Passion for Change — Topiary\'s Full Interview',
    description: 'The rare 3-hour interview with Jake Davis (Topiary) conducted just after LulzSec disbanded. Most of it was never published until now. Essential reading.',
    source: 'openDemocracy',
    url: 'https://www.opendemocracy.net/en/passion-for-change-lulzsec-interview/',
    year: '2011',
    duration: 'Long read',
  },
  {
    type: 'article',
    category: 'LEGENDS',
    title: 'Julian Assange: Inside the WikiLeaks Saga',
    description: 'The definitive video biography. From anonymous hacker to global figure to Belmarsh prisoner to free man. The most comprehensive single piece on Assange.',
    source: 'YouTube Documentary',
    url: 'https://www.youtube.com/watch?v=5MU54RdAhJE',
    year: '2025',
    duration: '1h 20m',
  },
];

// ─── FETCH PODCAST RSS ────────────────────────────────────────────────────────
async function fetchPodcasts() {
  const episodes = [];
  for (const feed of PODCAST_FEEDS) {
    try {
      const result = await parser.parseURL(feed.url);
      const items = result.items.slice(0, 3).map(item => ({
        type: 'podcast',
        title: item.title?.trim(),
        description: item.contentSnippet?.slice(0, 400) || item.summary?.slice(0, 400) || '',
        url: item.link || item.enclosure?.url,
        publishedAt: item.pubDate || item.isoDate,
        source: feed.name,
        host: feed.host,
        duration: item.itunes?.duration || '',
        category: feed.category,
      }));
      episodes.push(...items);
      console.log(`✓ ${feed.name}: ${items.length} episodes`);
    } catch (err) {
      console.log(`✗ ${feed.name}: ${err.message}`);
    }
  }
  return episodes;
}

// ─── CLAUDE CLASSIFICATION ────────────────────────────────────────────────────
async function classifyWithClaude(episodes) {
  const episodeList = episodes.slice(0, 30).map((e, i) =>
    `${i + 1}. TITLE: ${e.title}\n   SOURCE: ${e.source}\n   DESC: ${e.description?.slice(0, 200)}`
  ).join('\n\n');

  const prompt = `You are the editorial AI for lulz-sec.com — a legal tribute site honoring LulzSec, whistleblowers, and digital freedom fighters.

Review these ${Math.min(episodes.length, 30)} podcast episodes. Select the 8 most relevant for our audience.

Prioritize episodes about:
- LulzSec, Anonymous, hacktivist history (LULZSEC)
- Snowden, Assange, Manning, Swartz, whistleblowers (LEGENDS)
- Zero-day vulnerabilities, CVEs, breach analysis (ZERO DAY)
- Ethical hacking, bug bounties, pen testing careers (WHITE HAT)
- Digital rights, surveillance, press freedom (RIGHTS)

For each selected episode return:
- index: episode number from the list
- category: one of "LULZSEC", "LEGENDS", "ZERO DAY", "WHITE HAT", "RIGHTS", "HACKING"
- editorial_note: one punchy sentence in lulz-sec voice — irreverent, informed, never boring

Return ONLY a valid JSON array of up to 8 objects. No markdown, no explanation.

EPISODES:
${episodeList}`;

  try {
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
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
    console.log(`✓ Claude classified ${selected.length} episodes`);
    return selected;
  } catch (err) {
    console.log(`✗ Claude classification failed: ${err.message}`);
    return episodes.slice(0, 8).map((e, i) => ({
      index: i,
      category: e.category || 'HACKING',
      editorial_note: '',
    }));
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎙️ Starting lulz-sec media refresh...');

  // Fetch live podcast episodes
  const liveEpisodes = await fetchPodcasts();
  console.log(`📻 Total live episodes fetched: ${liveEpisodes.length}`);

  // Classify with Claude
  const classified = await classifyWithClaude(liveEpisodes);

  // Build classified episodes
  const freshEpisodes = classified.map(item => {
    const source = liveEpisodes[item.index] || liveEpisodes[0];
    return {
      type: source.type || 'podcast',
      title: source.title,
      url: source.url,
      source: source.source,
      host: source.host,
      publishedAt: source.publishedAt,
      duration: source.duration,
      category: item.category,
      editorial_note: item.editorial_note,
    };
  }).filter(e => e.title && e.url);

  // Combine: fresh classified episodes + curated static library
  const allMedia = {
    last_updated: new Date().toISOString(),
    episodes: [...freshEpisodes, ...CURATED_MEDIA],
  };

  // Write to file
  const outPath = path.join(__dirname, '..', 'data', 'podcasts.json');
  fs.writeFileSync(outPath, JSON.stringify(allMedia, null, 2));
  console.log(`✅ Media library written: ${allMedia.episodes.length} items`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
