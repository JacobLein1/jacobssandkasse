import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { CustomBetFeed } from '@/components/CustomBetFeed'
import type { EnrichedCustomBet } from '@/components/CustomBetCard'

export default async function BetsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: callerProfile } = user
    ? await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    : { data: null }
  const isAdmin = callerProfile?.is_admin ?? false

  const { data: betsRaw } = await supabase
    .from('custom_bets')
    .select('*')
    .order('created_at', { ascending: false })

  const allBets = betsRaw ?? []

  // Collect unique user IDs
  const userIdSet = new Set<string>()
  for (const b of allBets) {
    userIdSet.add(b.creator_id)
    if (b.opponent_id) userIdSet.add(b.opponent_id)
  }

  // Fetch profiles + matches in parallel
  const matchIds = [...new Set(allBets.filter(b => b.match_id).map(b => b.match_id as string))]

  const [{ data: profiles }, { data: matches }] = await Promise.all([
    userIdSet.size > 0
      ? supabase.from('profiles').select('id, username').in('id', [...userIdSet])
      : Promise.resolve({ data: [] }),
    matchIds.length > 0
      ? supabase.from('odds').select('match_id, home_team, away_team, match_date').in('match_id', matchIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.username as string | null]))
  const matchMap = new Map((matches ?? []).map(m => [m.match_id, m]))

  const bets: EnrichedCustomBet[] = allBets.map(b => ({
    ...b,
    creator_username: profileMap.get(b.creator_id) ?? null,
    opponent_username: b.opponent_id ? (profileMap.get(b.opponent_id) ?? null) : null,
    match_home_team: b.match_id ? (matchMap.get(b.match_id)?.home_team ?? null) : null,
    match_away_team: b.match_id ? (matchMap.get(b.match_id)?.away_team ?? null) : null,
    match_date: b.match_id ? (matchMap.get(b.match_id)?.match_date ?? null) : null,
  }))

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <main className="min-h-screen bg-page text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">Custom Bets</h1>
              <p className="text-gray-400 text-sm mt-0.5">Bet mot andre brukere</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <Link href="/bets/new"
                className="bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors">
                + Nytt bet
              </Link>
            )}
            <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Tilbake</Link>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-card border border-gray-800 rounded-xl px-4 py-3 mb-6 text-sm text-gray-400 leading-relaxed">
          <p className="font-medium text-gray-300 mb-1">Hvordan fungerer custom bets?</p>
          <ul className="space-y-1 text-xs">
            <li>• Bets kan være frie (egendefinerte) eller knyttet til en spesifikk kamp</li>
            <li>• Innsatsen trekkes umiddelbart — vinneren tar hele potten (2×)</li>
            <li>• Du kan redigere bettet inntil noen aksepterer det</li>
            <li>• For nisjebets må vinneren legge frem bevis — admin tar endelig avgjørelse</li>
          </ul>
        </div>

        {!user && (
          <div className="bg-detail border border-gray-700 rounded-xl px-4 py-3 mb-6 text-sm text-center">
            <Link href="/login" className="text-red-400 hover:text-red-300 font-medium">Logg inn</Link>
            <span className="text-gray-400"> for å opprette eller akseptere bets</span>
          </div>
        )}

        <CustomBetFeed bets={bets} userId={user?.id ?? null} isAdmin={isAdmin} todayStr={todayStr} />
      </div>
    </main>
  )
}
