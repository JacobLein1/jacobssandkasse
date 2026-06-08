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

function StatusBadge({ status }: { status: Bet['status'] }) {
  if (status === 'won') {
    return (
      <span className="inline-block text-xs font-semibold bg-green-900/60 text-green-400 rounded-full px-2.5 py-0.5">
        Vunnet
      </span>
    )
  }
  if (status === 'lost') {
    return (
      <span className="inline-block text-xs font-semibold bg-red-900/60 text-red-400 rounded-full px-2.5 py-0.5">
        Tapt
      </span>
    )
  }
  return (
    <span className="inline-block text-xs font-semibold bg-yellow-900/60 text-yellow-400 rounded-full px-2.5 py-0.5">
      Avventer
    </span>
  )
}

export default async function MineSpillPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('bets')
    .select('id, match_id, home_team, away_team, outcome, odds, amount, potential_win, totals_line, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const bets = (data ?? []) as Bet[]

  const totalAmount = bets.reduce((s, b) => s + Number(b.amount), 0)
  const totalWon = bets.filter(b => b.status === 'won').reduce((s, b) => s + Number(b.potential_win), 0)
  const netResult = totalWon - totalAmount

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">Mine spill</h1>
              <p className="text-gray-400 text-sm mt-0.5">{bets.length} spill totalt</p>
            </div>
          </div>
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Tilbake
          </Link>
        </div>

        {/* Summary */}
        {bets.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Spilt totalt</p>
              <p className="font-mono font-semibold text-sm">kr {totalAmount.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Gevinst utbetalt</p>
              <p className="font-mono font-semibold text-sm text-green-400">kr {totalWon.toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Netto</p>
              <p className={`font-mono font-semibold text-sm ${netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netResult >= 0 ? '+' : ''}{netResult.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {bets.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm mb-4">Du har ingen spill ennå.</p>
            <Link
              href="/"
              className="bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors inline-block"
            >
              Se kamper og spill
            </Link>
          </div>
        )}

        {bets.map(bet => (
          <div
            key={bet.id}
            className={`bg-gray-900 border rounded-2xl p-4 mb-3 ${
              bet.status === 'won'
                ? 'border-green-800/60'
                : bet.status === 'lost'
                ? 'border-red-900/40'
                : 'border-gray-800'
            }`}
          >
            {/* Match + status */}
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-semibold">
                {flag(bet.home_team)} {bet.home_team} – {bet.away_team} {flag(bet.away_team)}
              </p>
              <StatusBadge status={bet.status} />
            </div>

            {/* Outcome */}
            <p className="text-sm text-gray-300 mb-3">{outcomeLabel(bet)}</p>

            {/* Stats row */}
            <div className="flex gap-4 text-xs text-gray-400">
              <span>
                Odds <span className="text-white font-mono">{Number(bet.odds).toFixed(2)}</span>
              </span>
              <span>
                Innsats <span className="text-white font-mono">kr {Number(bet.amount).toFixed(2)}</span>
              </span>
              <span>
                {bet.status === 'won' ? 'Gevinst' : 'Mulig gevinst'}{' '}
                <span className={`font-mono ${bet.status === 'won' ? 'text-green-400' : 'text-white'}`}>
                  kr {Number(bet.potential_win).toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
