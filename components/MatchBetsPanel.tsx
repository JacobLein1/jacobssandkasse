'use client'

import { useEffect, useState, useTransition } from 'react'
import { fetchMatchBets, type MatchBetRow } from '@/app/actions/match-bets'
import { flag } from '@/lib/flags'
import type { MatchOdds } from '@/components/MatchList'

interface Props {
  match: MatchOdds
  onClose: () => void
}

function outcomeLabel(bet: MatchBetRow, match: MatchOdds): string {
  switch (bet.outcome) {
    case 'home':  return `${match.home_team} vinner`
    case 'draw':  return 'Uavgjort'
    case 'away':  return `${match.away_team} vinner`
    case 'over':  return `Over ${bet.totals_line ?? ''} mål`
    case 'under': return `Under ${bet.totals_line ?? ''} mål`
    default:      return bet.outcome
  }
}

export function MatchBetsPanel({ match, onClose }: Props) {
  const [bets, setBets] = useState<MatchBetRow[] | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const data = await fetchMatchBets(match.match_id)
      setBets(data)
    })
  }, [match.match_id])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-card border border-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800 shrink-0">
          <div>
            <h2 className="font-bold text-base leading-tight">
              {flag(match.home_team)} {match.home_team} vs {match.away_team} {flag(match.away_team)}
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">Andres spill på denne kampen</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl ml-4 shrink-0">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {isPending || bets === null ? (
            <p className="text-center text-gray-500 py-10 text-sm">Laster...</p>
          ) : bets.length === 0 ? (
            <p className="text-center text-gray-500 py-10 text-sm">Ingen har spilt på denne kampen ennå.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left pb-3 text-gray-400 font-medium">Bruker</th>
                  <th className="text-left pb-3 text-gray-400 font-medium">Spill</th>
                  <th className="text-right pb-3 text-gray-400 font-medium">Kr</th>
                  <th className="text-right pb-3 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet, i) => (
                  <tr key={i} className="border-b border-gray-800 last:border-0">
                    <td className="py-2.5 font-medium">{bet.username ?? 'ukjent'}</td>
                    <td className="py-2.5 text-gray-300">
                      <span>{outcomeLabel(bet, match)}</span>
                      <span className="text-gray-500 text-xs ml-1">@ {Number(bet.odds).toFixed(2)}</span>
                    </td>
                    <td className="py-2.5 text-right font-mono">{Number(bet.amount).toFixed(0)}</td>
                    <td className="py-2.5 text-right font-semibold font-mono">
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
          )}
        </div>
      </div>
    </div>
  )
}
