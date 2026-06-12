'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type BetState = { error: string } | { success: true } | null

export async function placeBet(_prev: BetState, formData: FormData): Promise<BetState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikke innlogget.' }

  const matchId = formData.get('match_id') as string
  const homeTeam = formData.get('home_team') as string
  const awayTeam = formData.get('away_team') as string
  const outcome = formData.get('outcome') as string
  const odds = parseFloat(formData.get('odds') as string)
  const amount = parseFloat(formData.get('amount') as string)
  const totalsLineRaw = formData.get('totals_line')
  const totalsLine = totalsLineRaw ? parseFloat(totalsLineRaw as string) : null

  if (!matchId || !homeTeam || !awayTeam) return { error: 'Ugyldig kamp.' }
  if (!['home', 'draw', 'away', 'over', 'under'].includes(outcome)) return { error: 'Velg et utfall.' }
  if (isNaN(odds) || odds <= 0) return { error: 'Ugyldige odds.' }
  if (isNaN(amount) || amount < 10) return { error: 'Minste innsats er 10 kr.' }

  const { data: match } = await supabase
    .from('odds')
    .select('settled, match_date')
    .eq('match_id', matchId)
    .single()

  if (match?.settled) return { error: 'Bettingen er lukket for denne kampen.' }
  if (match?.match_date && new Date(match.match_date) <= new Date()) {
    return { error: 'Kampen har allerede startet. Betting er stengt.' }
  }

  const { error } = await supabase.rpc('place_bet', {
    p_match_id: matchId,
    p_home_team: homeTeam,
    p_away_team: awayTeam,
    p_outcome: outcome,
    p_odds: odds,
    p_amount: amount,
    p_totals_line: totalsLine,
  })

  if (error) {
    if (error.message.includes('Insufficient balance')) return { error: 'Ikke nok penger på kontoen.' }
    if (error.message.includes('User not found')) return { error: 'Bruker ikke funnet.' }
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
