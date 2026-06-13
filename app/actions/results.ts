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

  const { data, error } = await supabase.rpc('settle_match_result', {
    p_match_id: matchId,
    p_home_goals: homeGoals,
    p_away_goals: awayGoals,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/resultater')
  revalidatePath('/mine-spill')
  revalidatePath('/')
  return { success: true, won: (data as { won: number; lost: number }).won, lost: (data as { won: number; lost: number }).lost }
}
