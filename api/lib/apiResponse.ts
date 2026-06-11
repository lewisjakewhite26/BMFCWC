import type { VercelResponse } from '@vercel/node'

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).setHeader('Content-Type', 'application/json').json(body)
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed'
}
