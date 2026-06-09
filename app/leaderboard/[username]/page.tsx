import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { flag } from '@/lib/flags'

interface Bet {
  home_team: string
  away_team: string
  outcome: string
  odds: number
  amount: number
  potential_win: number
  totals_line: number | null
  status: 'won' | 'lost'
  created_at: string
}

interface ProfileRow {
  username: string | null
  balance: number
  total_wagered: number
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

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const decoded = decodeURIComponent(username)

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: profileData }, { data: betsData }] = await Promise.all([
    anonClient
      .from('profiles')
      .select('username, balance, total_wagered')
      .ilike('username', decoded)
      .single(),
    anonClient.rpc('get_settled_bets_by_username', { p_username: decoded }),
  ])

  if (!profileData) notFound()

  const profile = profileData as ProfileRow
  const bets = (betsData ?? []) as Bet[]

  const totalWon = bets.filter(b => b.status === 'won').reduce((s, b) => s + Number(b.potential_win), 0)
  const totalLost = bets.filter(b => b.status === 'lost').reduce((s, b) => s + Number(b.amount), 0)

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-page text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Saldo: kr {Number(profile.balance).toFixed(2)}
              </p>
            </div>
          </div>
          <Link href="/leaderboard" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Ledertavle
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-card rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Spill avgjort</p>
            <p className="text-xl font-bold">{bets.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Total spilt</p>
            <p className="text-xl font-bold">kr {Number(profile.total_wagered).toFixed(0)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Netto</p>
            <p className={`text-xl font-bold ${totalWon - totalLost > 0 ? 'text-green-400' : totalWon - totalLost < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {totalWon - totalLost > 0 ? '+' : ''}{(totalWon - totalLost).toFixed(0)}
            </p>
          </div>
        </div>

        {bets.length === 0 ? (
          <p className="text-center text-gray-500 py-16 text-sm">Ingen avgjorte spill ennå.</p>
        ) : (
          <div className="bg-card border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Kamp</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Spill</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Innsats</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Resultat</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet, i) => (
                  <tr key={i} className={`border-b border-gray-800 last:border-0 ${i % 2 !== 0 ? 'bg-gray-900/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{flag(bet.home_team)} {bet.home_team}</p>
                      <p className="text-gray-400 text-xs">{flag(bet.away_team)} {bet.away_team}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 hidden sm:table-cell">
                      {outcomeLabel(bet)}
                      <span className="text-gray-500 ml-1">@ {Number(bet.odds).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      kr {Number(bet.amount).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {bet.status === 'won' ? (
                        <span className="text-green-400">+{Number(bet.potential_win).toFixed(0)}</span>
                      ) : (
                        <span className="text-red-400">−{Number(bet.amount).toFixed(0)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
