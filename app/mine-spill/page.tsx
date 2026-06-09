import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { MineSpillClient, type RegularBet, type EnrichedCustomBet } from './MineSpillClient'

export default async function MineSpillPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: betsData }, { data: customBetsRaw }] = await Promise.all([
    supabase
      .from('bets')
      .select('id, match_id, home_team, away_team, outcome, odds, amount, potential_win, totals_line, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('custom_bets')
      .select('*')
      .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .order('created_at', { ascending: false }),
  ])

  const bets = (betsData ?? []) as RegularBet[]
  const rawCustom = customBetsRaw ?? []

  // Enrich custom bets with opponent/creator usernames and match info
  const otherIds = new Set<string>()
  for (const b of rawCustom) {
    if (b.creator_id !== user.id) otherIds.add(b.creator_id)
    if (b.opponent_id && b.opponent_id !== user.id) otherIds.add(b.opponent_id)
  }
  const matchIds = [...new Set(rawCustom.filter(b => b.match_id).map(b => b.match_id as string))]

  const [{ data: profilesData }, { data: matchesData }] = await Promise.all([
    otherIds.size > 0
      ? supabase.from('profiles').select('id, username').in('id', [...otherIds])
      : Promise.resolve({ data: [] }),
    matchIds.length > 0
      ? supabase.from('odds').select('match_id, home_team, away_team').in('match_id', matchIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map((profilesData ?? []).map(p => [p.id, p.username as string | null]))
  const matchMap = new Map((matchesData ?? []).map(m => [m.match_id, m]))

  const customBets: EnrichedCustomBet[] = rawCustom.map(b => ({
    id: b.id,
    title: b.title,
    description: b.description,
    creator_side: b.creator_side,
    amount: b.amount,
    status: b.status,
    creator_id: b.creator_id,
    opponent_id: b.opponent_id,
    match_id: b.match_id,
    otherUsername: b.creator_id === user.id
      ? (b.opponent_id ? profileMap.get(b.opponent_id) ?? null : null)
      : profileMap.get(b.creator_id) ?? null,
    matchHomeTeam: b.match_id ? matchMap.get(b.match_id)?.home_team ?? null : null,
    matchAwayTeam: b.match_id ? matchMap.get(b.match_id)?.away_team ?? null : null,
  }))

  return (
    <main className="min-h-screen bg-page text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">Mine spill</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {bets.length} vanlige · {customBets.length} custom
              </p>
            </div>
          </div>
          <Link href="/" className="bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 transition-colors">
            ← Tilbake
          </Link>
        </div>

        <MineSpillClient bets={bets} customBets={customBets} userId={user.id} />
      </div>
    </main>
  )
}
