import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { flag } from '@/lib/flags'
import { Logo } from '@/components/Logo'

interface Bet {
  id: number
  match_id: string
  home_team: string
  away_team: string
  outcome: string
  odds: number
  amount: number
  potential_win: number
  totals_line: number | null
  status: 'pending' | 'won' | 'lost'
  created_at: string
}

interface CustomBet {
  id: number
  title: string
  description: string
  creator_side: string
  amount: number
  status: 'open' | 'matched' | 'pending_result' | 'won_creator' | 'won_opponent' | 'cancelled'
  creator_id: string
  opponent_id: string | null
  match_id: string | null
  created_at: string
}

function outcomeLabel(bet: Bet): string {
  switch (bet.outcome) {
    case 'home':  return `${bet.home_team} vinner`
    case 'draw':  return 'Uavgjort'
    case 'away':  return `${bet.away_team} vinner`
    case 'over':  return `Over ${bet.totals_line ?? ''} mål`
    case 'under': return `Under ${bet.totals_line ?? ''} mål`
    default:      return bet.outcome
  }
}

function BetStatusBadge({ status }: { status: Bet['status'] }) {
  if (status === 'won') return (
    <span className="inline-block text-xs font-semibold bg-green-900/60 text-green-400 rounded-full px-2.5 py-0.5">Vunnet</span>
  )
  if (status === 'lost') return (
    <span className="inline-block text-xs font-semibold bg-red-900/60 text-red-400 rounded-full px-2.5 py-0.5">Tapt</span>
  )
  return (
    <span className="inline-block text-xs font-semibold bg-yellow-900/60 text-yellow-400 rounded-full px-2.5 py-0.5">Avventer</span>
  )
}

function CustomBetStatusBadge({ status, isCreator }: { status: CustomBet['status']; isCreator: boolean }) {
  const won = (status === 'won_creator' && isCreator) || (status === 'won_opponent' && !isCreator)
  const lost = (status === 'won_creator' && !isCreator) || (status === 'won_opponent' && isCreator)

  if (won) return (
    <span className="inline-block text-xs font-semibold bg-green-900/60 text-green-400 rounded-full px-2.5 py-0.5">Vunnet</span>
  )
  if (lost) return (
    <span className="inline-block text-xs font-semibold bg-red-900/60 text-red-400 rounded-full px-2.5 py-0.5">Tapt</span>
  )
  if (status === 'matched') return (
    <span className="inline-block text-xs font-semibold bg-yellow-900/60 text-yellow-400 rounded-full px-2.5 py-0.5">Låst</span>
  )
  if (status === 'cancelled') return (
    <span className="inline-block text-xs font-semibold bg-gray-800 text-gray-500 rounded-full px-2.5 py-0.5">Avbrutt</span>
  )
  return (
    <span className="inline-block text-xs font-semibold bg-yellow-900/60 text-yellow-400 rounded-full px-2.5 py-0.5">Åpen</span>
  )
}

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

  const bets = (betsData ?? []) as Bet[]
  const customBets = (customBetsRaw ?? []) as CustomBet[]

  // Enrich custom bets with opponent/creator usernames and match info
  const otherIds = new Set<string>()
  for (const b of customBets) {
    if (b.creator_id !== user.id) otherIds.add(b.creator_id)
    if (b.opponent_id && b.opponent_id !== user.id) otherIds.add(b.opponent_id)
  }
  const matchIds = [...new Set(customBets.filter(b => b.match_id).map(b => b.match_id as string))]

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

  // Stats for regular bets
  const totalAmount = bets.reduce((s, b) => s + Number(b.amount), 0)
  const totalWon = bets.filter(b => b.status === 'won').reduce((s, b) => s + Number(b.potential_win), 0)
  const netResult = totalWon - totalAmount

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
          <Link href="/" className="bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 transition-colors">← Tilbake</Link>
        </div>

        {/* ── Vanlige spill ── */}
        <h2 className="text-base font-semibold text-gray-300 mb-3">Vanlige spill</h2>

        {bets.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-card border border-gray-800 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Spilt totalt</p>
              <p className="font-mono font-semibold text-sm">kr {totalAmount.toFixed(0)}</p>
            </div>
            <div className="bg-card border border-gray-800 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Gevinst</p>
              <p className="font-mono font-semibold text-sm text-green-400">kr {totalWon.toFixed(0)}</p>
            </div>
            <div className="bg-card border border-gray-800 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Netto</p>
              <p className={`font-mono font-semibold text-sm ${netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netResult >= 0 ? '+' : ''}{netResult.toFixed(0)}
              </p>
            </div>
          </div>
        )}

        {bets.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8 mb-6">
            Du har ingen vanlige spill ennå.{' '}
            <Link href="/" className="text-red-400 hover:text-red-300">Se kamper →</Link>
          </p>
        ) : (
          <div className="mb-8">
            {bets.map(bet => (
              <div key={bet.id} className={`bg-card border rounded-2xl p-4 mb-3 ${
                bet.status === 'won' ? 'border-green-800/60'
                : bet.status === 'lost' ? 'border-red-900/40'
                : 'border-gray-800'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-semibold">
                    {flag(bet.home_team)} {bet.home_team} – {bet.away_team} {flag(bet.away_team)}
                  </p>
                  <BetStatusBadge status={bet.status} />
                </div>
                <p className="text-sm text-gray-300 mb-3">{outcomeLabel(bet)}</p>
                <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                  <span>Odds <span className="text-white font-mono">{Number(bet.odds).toFixed(2)}</span></span>
                  <span>Innsats <span className="text-white font-mono">kr {Number(bet.amount).toFixed(0)}</span></span>
                  <span>
                    {bet.status === 'won' ? 'Gevinst' : 'Mulig gevinst'}{' '}
                    <span className={`font-mono ${bet.status === 'won' ? 'text-green-400' : 'text-white'}`}>
                      kr {Number(bet.potential_win).toFixed(0)}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Custom bets ── */}
        <h2 className="text-base font-semibold text-gray-300 mb-3">Custom bets</h2>

        {customBets.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            Du har ingen custom bets ennå.{' '}
            <Link href="/bets/new" className="text-red-400 hover:text-red-300">Opprett et bet →</Link>
          </p>
        ) : (
          customBets.map(bet => {
            const isCreator = bet.creator_id === user.id
            const otherUsername = isCreator
              ? (bet.opponent_id ? profileMap.get(bet.opponent_id) ?? null : null)
              : profileMap.get(bet.creator_id) ?? null
            const match = bet.match_id ? matchMap.get(bet.match_id) : null
            const isSettled = ['won_creator', 'won_opponent', 'cancelled'].includes(bet.status)
            const won = (bet.status === 'won_creator' && isCreator) || (bet.status === 'won_opponent' && !isCreator)
            const lost = (bet.status === 'won_creator' && !isCreator) || (bet.status === 'won_opponent' && isCreator)

            return (
              <div key={bet.id} className={`bg-card border rounded-2xl p-4 mb-3 ${
                won ? 'border-green-800/60'
                : lost ? 'border-red-900/40'
                : isSettled ? 'border-gray-800 opacity-60'
                : 'border-gray-800'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-semibold leading-tight">{bet.title}</p>
                  <CustomBetStatusBadge status={bet.status} isCreator={isCreator} />
                </div>

                <div className="bg-detail rounded-xl px-3 py-2 mb-3">
                  <p className="text-xs text-muted mb-0.5">Påstand</p>
                  <p className="text-sm">{bet.creator_side}</p>
                  {!isCreator && (
                    <p className="text-xs text-muted mt-1">Du tok imot — mente det motsatte.</p>
                  )}
                </div>

                {match && (
                  <p className="text-xs text-muted mb-3">
                    {flag(match.home_team)} {match.home_team} vs {match.away_team} {flag(match.away_team)}
                  </p>
                )}

                <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                  <span>
                    Mot <span className="text-white">{otherUsername ?? (bet.status === 'open' ? 'ingen ennå' : 'ukjent')}</span>
                  </span>
                  <span>
                    Innsats <span className="text-white font-mono">kr {Number(bet.amount).toFixed(0)}</span>
                  </span>
                  {(won || lost) && (
                    <span>
                      {won ? 'Gevinst' : 'Tap'}{' '}
                      <span className={`font-mono ${won ? 'text-green-400' : 'text-red-400'}`}>
                        {won ? `+kr ${(Number(bet.amount) * 2).toFixed(0)}` : `−kr ${Number(bet.amount).toFixed(0)}`}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
