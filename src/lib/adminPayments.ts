import toast from 'react-hot-toast'

export async function toggleUserPaid(
  adminId: string,
  sessionToken: string,
  userId: string,
  hasPaid: boolean,
  devMode: boolean
): Promise<void> {
  if (devMode) {
    toast.success(hasPaid ? 'Marked paid (preview)' : 'Marked unpaid (preview)')
    return
  }

  const { supabase } = await import('./supabase')
  const { error } = await supabase.rpc('admin_set_user_paid', {
    p_admin_id: adminId,
    p_session_token: sessionToken,
    p_target_user_id: userId,
    p_has_paid: hasPaid,
  })

  if (error) throw error
}
