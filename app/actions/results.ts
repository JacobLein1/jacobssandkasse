'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export type ResultState =
  | { error: string }
  | { success: true; won: number; lost: number }
  | null

export async function settleMatch(
  _prev: ResultState,
  formData: FormData
): Promise<ResultState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Ikke innlogget.' }

  const { data: caller } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!caller?.is_admin) return { error: 'Ingen tilgang.' }

  const matchId = formData.get('match_id') as string
  const homeGoals = parseInt(formData.get('home_goals') as string, 10)
  const awayGoals = parseInt(formData.get('away_goals') as string, 10)

  if (!matchId) return { error: 'Mangler kamp-ID.' }
  if (isNaN(homeGoals) || homeGoals < 0) return { error: 'Ugyldig antall hjemmemål.' }
  if (isNaN(awayGoals) || awayGoals < 0) return { error: 'Ugyldig antall bortemål.' }

  // Fetch all pending bets for this match
  const { data: bets, error: betsError } = await supabase
    .from('bets')
    .select('id, user_id, outcome, potential_win, totals_line')
    .eq('match_id', matchId)
    .eq('status', 'pending')

  if (betsError) return { error: betsError.message }
  if (!bets || bets.length === 0) {
    revalidatePath('/admin/resultater')
    return { success: true, won: 0, lost: 0 }
  }

  const totalGoals = homeGoals + awayGoals
  let wonCount = 0
  let lostCount = 0

  for (const bet of bets) {
    let won = false
    switch (bet.outcome) {
      case 'home':  won = homeGoals > awayGoals; break
      case 'draw':  won = homeGoals === awayGoals; break
      case 'away':  won = awayGoals > homeGoals; break
      case 'over':  won = bet.totals_line != null && totalGoals > Number(bet.totals_line); break
      case 'under': won = bet.totals_line != null && totalGoals < Number(bet.totals_line); break
    }

    await supabase
      .from('bets')
      .update({ status: won ? 'won' : 'lost' })
      .eq('id', bet.id)

    if (won) {
      wonCount++
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', bet.user_id)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ balance: Number(profile.balance) + Number(bet.potential_win) })
          .eq('id', bet.user_id)
      }
    } else {
      lostCount++
    }
  }

  revalidatePath('/admin/resultater')
  revalidatePath('/mine-spill')
  revalidatePath('/')
  return { success: true, won: wonCount, lost: lostCount }
}
