'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type AdminState = { error: string } | { success: true } | null

export async function updateBalance(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  const userId = formData.get('userId') as string
  const amount = parseFloat(formData.get('amount') as string)

  if (!userId || isNaN(amount)) return { error: 'Ugyldig input.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikke innlogget.' }

  const { error } = await supabase.rpc('admin_update_balance', {
    p_user_id: userId,
    p_amount: amount,
  })

  if (error) {
    if (error.message.includes('Not an admin')) return { error: 'Ingen tilgang.' }
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}
