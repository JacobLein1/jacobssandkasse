import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { flag } from '@/lib/flags'
import { ResolveButtons } from './ResolveButtons'

interface CustomBet {
  id: number
  creator_id: string
  opponent_id: string
  match_id: string | null
  title: string
  description: string
  creator_side: string
  opponent_side: string
  amount: number
  matched_at: string | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Oslo',
  })
}

export default async function AdminCustomBetsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: caller } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!caller?.is_admin) redirect('/')

  const { data: betsRaw } = await supabase
    .from('custom_bets')
    .select('id, creator_id, opponent_id, match_id, title, description, creator_side, opponent_side, amount, matched_at')
    .eq('status', 'matched')
    .order('matched_at', { ascending: true })

  const bets = (betsRaw ?? []) as CustomBet[]

  const userIds = [...new Set(bets.flatMap(b => [b.creator_id, b.opponent_id].filter(Boolean)))]
  const matchIds = [...new Set(bets.filter(b => b.match_id).map(b => b.match_id as string))]

  const [{ data: profiles }, { data: matches }] = await Promise.all([
    userIds.length > 0
      ? supabase.from('profiles').select('id, username').in('id', userIds)
      : Promise.resolve({ data: [] }),
    matchIds.length > 0
      ? supabase.from('odds').select('match_id, home_team, away_team').in('match_id', matchIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p.username as string | null]))
  const matchMap = new Map((matches ?? []).map(m => [m.match_id, m]))

  return (
    <main className="min-h-screen bg-page text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">Custom Bets</h1>
              <p className="text-gray-400 text-sm mt-0.5">Avgjør låste bets</p>
            </div>
          </div>
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Admin
          </Link>
        </div>

        {bets.length === 0 ? (
          <div className="bg-card border border-gray-800 rounded-2xl px-5 py-10 text-center text-gray-500 text-sm">
            Ingen bets venter på avgjørelse.
          </div>
        ) : (
          <div className="space-y-4">
            {bets.map(bet => {
              const creatorName = profileMap.get(bet.creator_id) ?? 'ukjent'
              const opponentName = profileMap.get(bet.opponent_id) ?? 'ukjent'
              const match = bet.match_id ? matchMap.get(bet.match_id) : null

              return (
                <div key={bet.id} className="bg-card border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-bold text-base">{bet.title}</h3>
                    <span className="text-xs text-gray-500 shrink-0 font-mono">kr {Number(bet.amount).toFixed(0)} × 2</span>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{bet.description}</p>

                  <div className="flex items-center gap-2 text-sm mb-4">
                    <span className="bg-detail rounded-lg px-3 py-1.5 flex-1 text-center truncate font-medium">
                      {creatorName}: {bet.creator_side}
                    </span>
                    <span className="text-muted shrink-0">vs</span>
                    <span className="bg-detail rounded-lg px-3 py-1.5 flex-1 text-center truncate text-gray-300">
                      {opponentName}: {bet.opponent_side}
                    </span>
                  </div>

                  {match && (
                    <p className="text-xs text-muted mb-4">
                      {flag(match.home_team)} {match.home_team} vs {match.away_team} {flag(match.away_team)}
                    </p>
                  )}

                  {bet.matched_at && (
                    <p className="text-xs text-gray-600 mb-4">Akseptert {fmtDate(bet.matched_at)}</p>
                  )}

                  <ResolveButtons betId={bet.id} creatorName={creatorName} opponentName={opponentName} />
                </div>
              )
            })}
          </div>
        )}

        <p className="text-gray-600 text-xs mt-6 text-center">
          Vinneren mottar 2× innsatsen. Avgjørelsen er endelig.
        </p>
      </div>
    </main>
  )
}
