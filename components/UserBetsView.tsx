'use client'

import { useState } from 'react'
import { flag } from '@/lib/flags'

export interface AllBet {
  home_team: string
  away_team: string
  outcome: string
  odds: number
  amount: number
  potential_win: number
  totals_line: number | null
  settled: boolean
  won: boolean
  created_at: string
}

export interface UserCustomBet {
  id: number
  title: string
  description: string
  creator_side: string
  amount: number
  status: 'open' | 'matched' | 'pending_result' | 'won_creator' | 'won_opponent' | 'cancelled'
  creator_id: string
  opponent_id: string | null
  creator_username: string | null
  opponent_username: string | null
  match_home_team: string | null
  match_away_team: string | null
  created_at: string
}

interface Props {
  bets: AllBet[]
  customBets: UserCustomBet[]
  profileUserId: string
}

type TopTab = 'spill' | 'custom'
type BetFilter = 'alle' | 'aktive' | 'avgjorte'

function outcomeLabel(bet: AllBet): string {
  switch (bet.outcome) {
    case 'home':  return `${bet.home_team} vinner`
    case 'draw':  return 'Uavgjort'
    case 'away':  return `${bet.away_team} vinner`
    case 'over':  return `Over ${bet.totals_line ?? ''} mål`
    case 'under': return `Under ${bet.totals_line ?? ''} mål`
    default:      return bet.outcome
  }
}

function CustomStatusBadge({ status }: { status: UserCustomBet['status'] }) {
  switch (status) {
    case 'open':
      return <span className="text-xs font-semibold bg-green-900/40 text-green-400 rounded-full px-2 py-0.5">Åpen</span>
    case 'matched':
      return <span className="text-xs font-semibold bg-yellow-900/40 text-yellow-400 rounded-full px-2 py-0.5">Låst</span>
    case 'won_creator':
    case 'won_opponent':
      return <span className="text-xs font-semibold bg-detail text-gray-400 rounded-full px-2 py-0.5">Avgjort</span>
    case 'cancelled':
      return <span className="text-xs font-semibold bg-detail text-gray-500 rounded-full px-2 py-0.5">Avbrutt</span>
    default:
      return null
  }
}

export function UserBetsView({ bets, customBets, profileUserId }: Props) {
  const [topTab, setTopTab] = useState<TopTab>('spill')
  const [filter, setFilter] = useState<BetFilter>('alle')

  const settled = bets.filter(b => b.settled)
  const active = bets.filter(b => !b.settled)
  const visible = filter === 'aktive' ? active : filter === 'avgjorte' ? settled : bets

  const filters: [BetFilter, string, number][] = [
    ['alle', 'Alle', bets.length],
    ['aktive', 'Aktive', active.length],
    ['avgjorte', 'Avgjorte', settled.length],
  ]

  return (
    <>
      {/* Top-level tab switch */}
      <div className="flex gap-1 bg-detail rounded-xl p-1 mb-5">
        <button
          onClick={() => setTopTab('spill')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
            topTab === 'spill' ? 'bg-card text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Spill ({bets.length})
        </button>
        <button
          onClick={() => setTopTab('custom')}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
            topTab === 'custom' ? 'bg-card text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Custom bets ({customBets.length})
        </button>
      </div>

      {/* Regular bets */}
      {topTab === 'spill' && (
        <>
          <div className="flex gap-1 bg-detail/50 rounded-xl p-1 mb-5">
            {filters.map(([val, label, count]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                  filter === val ? 'bg-card text-white' : 'text-gray-400 hover:text-white'
                }`}>
                {label} <span className="text-xs opacity-60">({count})</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-center text-gray-500 py-10 text-sm">
              {filter === 'aktive' ? 'Ingen aktive spill.' : filter === 'avgjorte' ? 'Ingen avgjorte spill.' : 'Ingen spill ennå.'}
            </p>
          ) : (
            <div className="bg-card border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Kamp</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">Spill</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Kr</th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">Resultat</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((bet, i) => (
                    <tr key={i} className={`border-b border-gray-800 last:border-0 ${i % 2 !== 0 ? 'bg-gray-900/30' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{flag(bet.home_team)} {bet.home_team}</p>
                        <p className="text-gray-400 text-xs">{flag(bet.away_team)} {bet.away_team}</p>
                        <p className="text-gray-300 text-xs mt-1 sm:hidden">
                          {outcomeLabel(bet)}
                          <span className="text-gray-500 ml-1">@ {Number(bet.odds).toFixed(2)}</span>
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 hidden sm:table-cell">
                        {outcomeLabel(bet)}
                        <span className="text-gray-500 ml-1">@ {Number(bet.odds).toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{Number(bet.amount).toFixed(0)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {!bet.settled ? (
                          <span className="text-yellow-400 text-xs font-medium">Venter</span>
                        ) : bet.won ? (
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
        </>
      )}

      {/* Custom bets */}
      {topTab === 'custom' && (
        <>
          {customBets.length === 0 ? (
            <p className="text-center text-gray-500 py-10 text-sm">Ingen custom bets.</p>
          ) : (
            <div className="space-y-3">
              {customBets.map(bet => {
                const isCreator = profileUserId === bet.creator_id
                const isSettled = ['won_creator', 'won_opponent', 'cancelled'].includes(bet.status)
                const wonByUser =
                  (bet.status === 'won_creator' && isCreator) ||
                  (bet.status === 'won_opponent' && !isCreator)
                const lostByUser =
                  (bet.status === 'won_creator' && !isCreator) ||
                  (bet.status === 'won_opponent' && isCreator)
                const otherUser = isCreator ? bet.opponent_username : bet.creator_username

                return (
                  <div key={bet.id} className={`bg-card border border-gray-800 rounded-xl p-4 ${isSettled ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-semibold text-sm leading-tight">{bet.title}</p>
                      <CustomStatusBadge status={bet.status} />
                    </div>

                    <div className="bg-detail rounded-lg px-3 py-2 mb-3">
                      <p className="text-xs text-muted mb-0.5">Påstand</p>
                      <p className="text-sm">{bet.creator_side}</p>
                      {!isCreator && (
                        <p className="text-xs text-muted mt-1">Tok imot bettet — mente det motsatte.</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">
                        {otherUser ? `mot ${otherUser}` : 'ingen motpart ennå'}
                      </span>
                      <span className="font-mono font-bold">
                        {wonByUser ? (
                          <span className="text-green-400">+{Number(bet.amount).toFixed(0)}</span>
                        ) : lostByUser ? (
                          <span className="text-red-400">−{Number(bet.amount).toFixed(0)}</span>
                        ) : (
                          <span className="text-white">kr {Number(bet.amount).toFixed(0)}</span>
                        )}
                      </span>
                    </div>

                    {bet.match_home_team && (
                      <p className="text-xs text-muted mt-2">
                        {flag(bet.match_home_team)} {bet.match_home_team} vs {bet.match_away_team} {flag(bet.match_away_team ?? '')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </>
  )
}
