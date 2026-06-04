/**
 * Capture full-page screenshots of every app route.
 * Usage: node scripts/capture-screenshots.mjs [baseUrl]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'screenshots')
const BASE_URL = process.argv[2] ?? 'http://localhost:5174'
const STORAGE_KEY = 'bmfc_session'

const DEV_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  username: 'preview_user',
  display_name: 'Preview Player',
  is_admin: false,
  total_points: 45,
  session_token: 'dev-bypass-token',
}

const DEV_ADMIN = {
  id: '00000000-0000-0000-0000-000000000002',
  username: 'preview_admin',
  display_name: 'Preview Admin',
  is_admin: true,
  total_points: 120,
  session_token: 'dev-bypass-token',
}

const PAGES = [
  { file: '01-landing', path: '/', auth: null },
  { file: '02-login', path: '/login', auth: null },
  { file: '03-signup', path: '/signup', auth: null },
  { file: '04-leaderboard', path: '/leaderboard', auth: null },
  { file: '05-dashboard', path: '/dashboard', auth: DEV_USER },
  { file: '06-history', path: '/history', auth: DEV_USER },
  { file: '07-admin', path: '/admin', auth: DEV_ADMIN },
]

async function capture(viewport, subfolder) {
  const dir = join(OUT_DIR, subfolder)
  mkdirSync(dir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
  })

  for (const page of PAGES) {
    if (page.auth) {
      await context.addInitScript(
        ({ key, user }) => localStorage.setItem(key, JSON.stringify(user)),
        { key: STORAGE_KEY, user: page.auth }
      )
    } else {
      await context.addInitScript((key) => localStorage.removeItem(key), STORAGE_KEY)
    }

    const tab = await context.newPage()
    await tab.goto(`${BASE_URL}${page.path}`, { waitUntil: 'networkidle', timeout: 30000 })
    await tab.waitForTimeout(800)
    await tab.screenshot({
      path: join(dir, `${page.file}.png`),
      fullPage: true,
    })
    await tab.close()
    console.log(`  ✓ ${subfolder}/${page.file}.png`)
  }

  await browser.close()
}

console.log(`Capturing screenshots from ${BASE_URL}`)
console.log(`Output: ${OUT_DIR}\n`)

await capture({ width: 390, height: 844 }, 'mobile')
await capture({ width: 1280, height: 800 }, 'desktop')

console.log('\nDone.')
