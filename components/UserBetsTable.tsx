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

type Filter = 'alle' | 'aktive' | 'avgjorte'

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

export function UserBetsTable({ bets }: { bets: AllBet[] }) {
  const [filter, setFilter] = useState<Filter>('alle')

  const settled = bets.filter(b => b.settled)
  const active = bets.filter(b => !b.settled)

  const visible = filter === 'aktive' ? active
    : filter === 'avgjorte' ? settled
    : bets

  const filters: [Filter, string, number][] = [
    ['alle', 'Alle', bets.length],
    ['aktive', 'Aktive', active.length],
    ['avgjorte', 'Avgjorte', settled.length],
  ]

  if (bets.length === 0) {
    return <p className="text-center text-gray-500 py-16 text-sm">Ingen spill ennå.</p>
  }

  return (
    <>
      <div className="flex gap-1 bg-detail rounded-xl p-1 mb-5">
        {filters.map(([val, label, count]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              filter === val ? 'bg-card text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {label} {count > 0 && <span className="text-xs opacity-60">({count})</span>}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-center text-gray-500 py-10 text-sm">
          {filter === 'aktive' ? 'Ingen aktive spill.' : 'Ingen avgjorte spill.'}
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
                  </td>
                  <td className="px-4 py-3 text-gray-300 hidden sm:table-cell">
                    {outcomeLabel(bet)}
                    <span className="text-gray-500 ml-1">@ {Number(bet.odds).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {Number(bet.amount).toFixed(0)}
                  </td>
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
  )
}
