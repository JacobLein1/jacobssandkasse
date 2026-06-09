'use server'

import { createClient } from '@supabase/supabase-js'

export interface MatchBetRow {
  username: string | null
  outcome: string
  amount: number
  odds: number
  potential_win: number
  totals_line: number | null
  settled: boolean
  won: boolean
  created_at: string
}

export async function fetchMatchBets(matchId: string): Promise<MatchBetRow[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase.rpc('get_bets_for_match', { p_match_id: matchId })
  return (data ?? []) as MatchBetRow[]
}
