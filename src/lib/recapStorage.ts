const STORAGE_KEY = 'bmfc_recap_seen'

export function getDismissedRecaps(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

export function markRecapSeen(gameDay: number): void {
  const seen = getDismissedRecaps()
  if (seen.includes(gameDay)) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, gameDay].sort((a, b) => a - b)))
}
