import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isAdminAuthorized } from './lib/adminAuth.js'
import { errorMessage, sendJson } from './lib/apiResponse.js'
import { runProcessProgression } from './lib/processProgression.js'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    if (!(await isAdminAuthorized(req))) {
      sendJson(res, 401, { error: 'Unauthorized' })
      return
    }

    const force = req.method === 'POST'
    const result = await runProcessProgression({ force })
    sendJson(res, 200, result)
  } catch (error) {
    console.error('Progression error:', error)
    sendJson(res, 500, { success: false, error: errorMessage(error) })
  }
}
