import type { VercelRequest } from '@vercel/node'
import { getSupabaseAdmin } from './supabaseAdmin.js'

export async function isAdminAuthorized(req: VercelRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.authorization

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  if (req.method === 'POST') {
    try {
      const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
        admin_id?: string
        session_token?: string
      }
      if (!body?.admin_id || !body?.session_token) return false

      const supabase = getSupabaseAdmin()
      const { data: user } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', body.admin_id)
        .eq('session_token', body.session_token)
        .maybeSingle()

      return user?.is_admin === true
    } catch {
      return false
    }
  }

  if (process.env.NODE_ENV === 'development' && !cronSecret) {
    return true
  }

  return false
}
