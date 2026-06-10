/**
 * Compare group-stage fixtures in generate-seed.mjs against API-Football.
 * Run: node scripts/verify-fixtures-api.mjs
 * Requires API_FOOTBALL_KEY (and related vars) in .env
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  const envPath = join(ROOT, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const TEAM_ALIASES = {
  'cote divoire': 'ivory coast',
  'korea republic': 'south korea',
  'congo dr': 'dr congo',
  'democratic republic of the congo': 'dr congo',
  'united states': 'usa',
  'bosnia and herzegovina': 'bosnia herzegovina',
};

function normalizeTeam(name) {
  let n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  n = TEAM_ALIASES[n] ?? n;
  if (n.includes('ivory coast')) n = 'ivory coast';
  return n;
}

function teamsMatch(home, away, apiHome, apiAway) {
  const dh = normalizeTeam(home);
  const da = normalizeTeam(away);
  const ah = normalizeTeam(apiHome);
  const aa = normalizeTeam(apiAway);
  const homeOk = dh === ah || dh.includes(ah) || ah.includes(dh);
  const awayOk = da === aa || da.includes(aa) || aa.includes(da);
  return homeOk && awayOk;
}

function normalizeVenue(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function venuesMatch(ours, apiVenue) {
  const a = normalizeVenue(ours);
  const b = normalizeVenue(apiVenue);
  return a === b || a.includes(b) || b.includes(a);
}

async function fetchApiFixtures() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const baseUrl = process.env.API_FOOTBALL_BASE_URL ?? 'https://v3.football.api-sports.io';
  const league = process.env.API_FOOTBALL_LEAGUE ?? '1';
  const season = process.env.API_FOOTBALL_SEASON ?? '2026';

  if (!apiKey) {
    throw new Error('Missing API_FOOTBALL_KEY in .env');
  }

  const url = `${baseUrl}/fixtures?league=${league}&season=${season}`;
  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
      'x-rapidapi-key': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Football responded with ${response.status}`);
  }

  const data = await response.json();
  return data.response ?? [];
}

function findApiMatch(ourFixture, apiFixtures, bstToUtc) {
  const [day, month, year] = ourFixture.date.split(' ');
  const kickoff = new Date(bstToUtc(`${day} ${month} ${year}`, ourFixture.time)).getTime();

  let best = null;
  for (const api of apiFixtures) {
    if (!teamsMatch(ourFixture.home, ourFixture.away, api.teams.home.name, api.teams.away.name)) {
      continue;
    }
    const apiTime = new Date(api.fixture.date).getTime();
    const delta = Math.abs(apiTime - kickoff);
    if (!best || delta < best.delta) {
      best = { api, delta };
    }
  }

  if (!best || best.delta > 6 * 60 * 60 * 1000) return null;
  return best.api;
}

loadEnv();

const { groupFixtures, bstToUtc } = await import(
  pathToFileURL(join(ROOT, 'scripts', 'generate-seed.mjs')).href
);

const apiFixtures = await fetchApiFixtures();
console.log(`Fetched ${apiFixtures.length} fixtures from API-Football\n`);

const mismatches = [];
const missing = [];

for (const f of groupFixtures) {
  const api = findApiMatch(f, apiFixtures, bstToUtc);
  const label = `MD${f.gd} Group ${f.group}: ${f.home} vs ${f.away}`;

  if (!api) {
    missing.push(label);
    continue;
  }

  const apiVenue = api.fixture.venue?.name ?? '';
  const apiCity = api.fixture.venue?.city ?? '';
  const apiKickoff = api.fixture.date;
  const [day, month, year] = f.date.split(' ');
  const ourKickoff = bstToUtc(`${day} ${month} ${year}`, f.time);

  if (!venuesMatch(f.venue, apiVenue)) {
    mismatches.push({
      label,
      field: 'venue',
      ours: `${f.venue} (${f.city})`,
      api: `${apiVenue} (${apiCity})`,
      kickoff: apiKickoff,
    });
  }

  const kickoffDelta = Math.abs(new Date(ourKickoff).getTime() - new Date(apiKickoff).getTime());
  if (kickoffDelta > 30 * 60 * 1000) {
    mismatches.push({
      label,
      field: 'kickoff',
      ours: ourKickoff,
      api: apiKickoff,
      deltaMin: Math.round(kickoffDelta / 60000),
    });
  }
}

if (missing.length) {
  console.log(`⚠️  No API match (${missing.length}):`);
  for (const m of missing) console.log(`   - ${m}`);
  console.log();
}

if (!mismatches.length) {
  console.log('✅ All matched group fixtures agree with API-Football on venue and kickoff.');
} else {
  console.log(`❌ ${mismatches.length} mismatch(es):\n`);
  for (const m of mismatches) {
    console.log(`   ${m.label}`);
    if (m.field === 'venue') {
      console.log(`      venue: ours="${m.ours}"  api="${m.api}"`);
    } else {
      console.log(`      kickoff: ours=${m.ours}  api=${m.api}  (Δ ${m.deltaMin} min)`);
    }
    console.log();
  }
  process.exit(1);
}
