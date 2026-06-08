'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BetModal } from '@/components/BetModal'
import { flag } from '@/lib/flags'

export type TotalsMap = Record<string, { over?: number; under?: number }>

export interface MatchOdds {
  id: number
  match_id: string
  home_team: string
  away_team: string
  match_date: string
  home_odds: number | null
  draw_odds: number | null
  away_odds: number | null
  bookmaker: string | null
  totals: TotalsMap | null
  updated_at: string
}

interface MatchListProps {
  matches: MatchOdds[]
  userId: string | null
}

function fmt(odds: number | null): string {
  return odds != null ? odds.toFixed(2) : '—'
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Oslo',
  })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Oslo',
  })
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'nettopp'
  if (mins < 60) return `${mins} min siden`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h} t siden`
  return `${Math.floor(h / 24)} d siden`
}

function OddsCell({
  label,
  value,
  highlight,
}: {
  label: string
  value: number | null
  highlight?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl px-3 py-3 gap-1 ${
        highlight ? 'bg-red-700' : 'bg-gray-800'
      }`}
    >
      <span className="text-xs text-gray-400 truncate max-w-full text-center leading-tight">
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums">{fmt(value)}</span>
    </div>
  )
}

function MatchCard({ match }: { match: MatchOdds }) {
  const totalsLines = match.totals
    ? Object.entries(match.totals).sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    : []

  return (
    <article className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4 shadow-lg">
      <p className="text-gray-400 text-sm mb-5 capitalize">
        {fmtDate(match.match_date)}&nbsp;&middot;&nbsp;{fmtTime(match.match_date)}
      </p>

      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col items-center gap-1 w-5/12">
          <span className="text-5xl leading-none">{flag(match.home_team)}</span>
          <span className="text-sm font-semibold text-center mt-1">{match.home_team}</span>
        </div>
        <span className="text-gray-600 text-sm font-medium">vs</span>
        <div className="flex flex-col items-center gap-1 w-5/12">
          <span className="text-5xl leading-none">{flag(match.away_team)}</span>
          <span className="text-sm font-semibold text-center mt-1">{match.away_team}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <OddsCell
          label={match.home_team}
          value={match.home_odds}
          highlight={match.home_team === 'Norway'}
        />
        <OddsCell label="Uavgjort" value={match.draw_odds} />
        <OddsCell
          label={match.away_team}
          value={match.away_odds}
          highlight={match.away_team === 'Norway'}
        />
      </div>

      {totalsLines.length > 0 && (
        <div className="border-t border-gray-800 pt-4 mt-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Over/Under mål</p>
          {totalsLines.map(([line, odds]) => (
            <div key={line} className="grid grid-cols-2 gap-2 mb-2 last:mb-0">
              <div className="bg-gray-800 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Over {line}</p>
                <p className="text-xl font-bold tabular-nums">{fmt(odds.over ?? null)}</p>
              </div>
              <div className="bg-gray-800 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Under {line}</p>
                <p className="text-xl font-bold tabular-nums">{fmt(odds.under ?? null)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-between text-xs text-gray-600">
        {match.bookmaker ? <span>via {match.bookmaker}</span> : <span />}
        <span>Oppdatert {timeAgo(match.updated_at)}</span>
      </div>

      <p className="text-center text-xs text-gray-600 mt-3">Trykk for å spille →</p>
    </article>
  )
}

export function MatchList({ matches, userId }: MatchListProps) {
  const router = useRouter()
  const [activeMatch, setActiveMatch] = useState<MatchOdds | null>(null)

  const handleSuccess = useCallback(() => {
    setActiveMatch(null)
    router.refresh()
  }, [router])

  return (
    <>
      {matches.map(match => (
        <div
          key={match.match_id}
          onClick={() => setActiveMatch(match)}
          className="cursor-pointer"
        >
          <MatchCard match={match} />
        </div>
      ))}

      {activeMatch && (
        <BetModal
          match={activeMatch}
          userId={userId}
          onClose={() => setActiveMatch(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
