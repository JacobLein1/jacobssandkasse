'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type CustomBetState = { error: string } | { success: true } | null

export async function deleteCustomBet(
  _prev: CustomBetState,
  formData: FormData
): Promise<CustomBetState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikke innlogget.' }

  const betId = parseInt(formData.get('bet_id') as string, 10)

  const { error } = await supabase.rpc('admin_delete_custom_bet', { p_bet_id: betId })

  if (error) {
    if (error.message.includes('Not an admin')) return { error: 'Ingen tilgang.' }
    return { error: error.message }
  }

  revalidatePath('/bets')
  revalidatePath('/admin/custom-bets')
  revalidatePath('/')
  return { success: true }
}

export async function createCustomBet(
  _prev: CustomBetState,
  formData: FormData
): Promise<CustomBetState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikke innlogget.' }

  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const creatorSide = (formData.get('creator_side') as string).trim()
  const amount = parseFloat(formData.get('amount') as string)
  const matchId = (formData.get('match_id') as string) || null

  if (!title) return { error: 'Tittel er påkrevd.' }
  if (!creatorSide) return { error: 'Påstanden er påkrevd.' }
  if (isNaN(amount) || amount < 10) return { error: 'Minste innsats er 10 kr.' }

  const { error } = await supabase.rpc('create_custom_bet', {
    p_title: title,
    p_description: description,
    p_creator_side: creatorSide,
    p_opponent_side: '',
    p_amount: amount,
    p_match_id: matchId,
  })

  if (error) {
    if (error.message.includes('Insufficient balance')) return { error: 'Ikke nok penger på kontoen.' }
    if (error.message.includes('User not found')) return { error: 'Bruker ikke funnet.' }
    return { error: error.message }
  }

  revalidatePath('/bets')
  revalidatePath('/')
  redirect('/bets')
}

export async function acceptCustomBet(
  _prev: CustomBetState,
  formData: FormData
): Promise<CustomBetState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikke innlogget.' }

  const betId = parseInt(formData.get('bet_id') as string, 10)

  const { error } = await supabase.rpc('accept_custom_bet', { p_bet_id: betId })

  if (error) {
    if (error.message.includes('Insufficient balance')) return { error: 'Ikke nok penger.' }
    if (error.message.includes('Cannot accept your own bet')) return { error: 'Du kan ikke akseptere ditt eget bet.' }
    if (error.message.includes('already matched')) return { error: 'Bettet er allerede akseptert.' }
    return { error: error.message }
  }

  revalidatePath('/bets')
  revalidatePath('/')
  return { success: true }
}

export async function cancelCustomBet(
  _prev: CustomBetState,
  formData: FormData
): Promise<CustomBetState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikke innlogget.' }

  const betId = parseInt(formData.get('bet_id') as string, 10)

  const { error } = await supabase.rpc('cancel_custom_bet', { p_bet_id: betId })

  if (error) {
    if (error.message.includes('Not your bet')) return { error: 'Ikke ditt bet.' }
    return { error: error.message }
  }

  revalidatePath('/bets')
  revalidatePath('/')
  return { success: true }
}

export async function updateCustomBet(
  _prev: CustomBetState,
  formData: FormData
): Promise<CustomBetState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikke innlogget.' }

  const betId = parseInt(formData.get('bet_id') as string, 10)
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const creatorSide = (formData.get('creator_side') as string).trim()
  const amount = parseFloat(formData.get('amount') as string)

  if (!title) return { error: 'Tittel er påkrevd.' }
  if (!creatorSide) return { error: 'Påstanden er påkrevd.' }
  if (isNaN(amount) || amount < 10) return { error: 'Minste innsats er 10 kr.' }

  const { error } = await supabase.rpc('update_custom_bet', {
    p_bet_id: betId,
    p_title: title,
    p_description: description,
    p_creator_side: creatorSide,
    p_opponent_side: '',
    p_amount: amount,
  })

  if (error) {
    if (error.message.includes('Insufficient balance')) return { error: 'Ikke nok penger.' }
    if (error.message.includes('Not your bet')) return { error: 'Ikke ditt bet.' }
    return { error: error.message }
  }

  revalidatePath('/bets')
  revalidatePath('/')
  return { success: true }
}

export async function resolveCustomBet(
  _prev: CustomBetState,
  formData: FormData
): Promise<CustomBetState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikke innlogget.' }

  const betId = parseInt(formData.get('bet_id') as string, 10)
  const winner = formData.get('winner') as string

  const { error } = await supabase.rpc('resolve_custom_bet', {
    p_bet_id: betId,
    p_winner: winner,
  })

  if (error) {
    if (error.message.includes('Not an admin')) return { error: 'Ingen tilgang.' }
    return { error: error.message }
  }

  revalidatePath('/admin/custom-bets')
  revalidatePath('/bets')
  revalidatePath('/')
  return { success: true }
}
