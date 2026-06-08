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

  // Verify the caller is an admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikke innlogget.' }

  const { data: caller } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!caller?.is_admin) return { error: 'Ingen tilgang.' }

  // Fetch current balance, then set the new one
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single()

  if (!profile) return { error: 'Bruker ikke funnet.' }

  const newBalance = Number(profile.balance) + amount

  const { error } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}
