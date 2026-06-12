'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BetModal } from '@/components/BetModal'
import { MatchBetsPanel } from '@/components/MatchBetsPanel'
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
  settled: boolean
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
        highlight ? 'bg-red-700' : 'bg-detail'
      }`}
    >
      <span className="text-xs text-gray-400 truncate max-w-full text-center leading-tight">
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums">{fmt(value)}</span>
    </div>
  )
}

function MatchCard({ match, hasStarted, onShowBets }: { match: MatchOdds; hasStarted: boolean; onShowBets: () => void }) {
  const totalsLines = match.totals
    ? Object.entries(match.totals).sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    : []

  return (
    <article className={`bg-card border rounded-2xl p-5 mb-4 shadow-lg ${match.settled ? 'border-gray-800 opacity-60' : 'border-gray-800'}`}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-400 text-sm capitalize">
          {fmtDate(match.match_date)}&nbsp;&middot;&nbsp;{fmtTime(match.match_date)}
        </p>
        {match.settled ? (
          <span className="text-xs font-semibold bg-detail text-gray-400 rounded-full px-2.5 py-1">
            Avgjort
          </span>
        ) : hasStarted ? (
          <span className="text-xs font-semibold bg-yellow-900/60 text-yellow-400 rounded-full px-2.5 py-1">
            Pågår
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col items-center gap-1 w-5/12">
          <span className="text-5xl leading-none">{flag(match.home_team)}</span>
          <span className="text-sm font-semibold text-center mt-1">{match.home_team}</span>
        </div>
        <span className="text-muted text-sm font-medium">vs</span>
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
          <p className="text-xs text-muted uppercase tracking-widest mb-2">Over/Under mål</p>
          {totalsLines.map(([line, odds]) => (
            <div key={line} className="grid grid-cols-2 gap-2 mb-2 last:mb-0">
              <div className="bg-detail rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Over {line}</p>
                <p className="text-xl font-bold tabular-nums">{fmt(odds.over ?? null)}</p>
              </div>
              <div className="bg-detail rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">Under {line}</p>
                <p className="text-xl font-bold tabular-nums">{fmt(odds.under ?? null)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-between text-xs text-muted">
        {match.bookmaker ? <span>via {match.bookmaker}</span> : <span />}
        <span>Oppdatert {timeAgo(match.updated_at)}</span>
      </div>

      <div className="mt-4 flex gap-2">
        {!match.settled && (
          <div className={`flex-1 rounded-xl px-4 py-2.5 text-center text-xs ${hasStarted ? 'bg-yellow-900/30 text-yellow-600' : 'bg-detail text-muted'}`}>
            {hasStarted ? 'Betting stengt' : 'Trykk for å spille →'}
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onShowBets() }}
          className={`${match.settled ? 'w-full' : 'flex-1'} bg-detail hover:bg-gray-600 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors`}
        >
          Se andres spill
        </button>
      </div>
    </article>
  )
}

export function MatchList({ matches, userId }: MatchListProps) {
  const router = useRouter()
  const [activeMatch, setActiveMatch] = useState<MatchOdds | null>(null)
  const [betsMatch, setBetsMatch] = useState<MatchOdds | null>(null)

  const handleSuccess = useCallback(() => {
    setActiveMatch(null)
    router.refresh()
  }, [router])

  return (
    <>
      {matches.map(match => {
        const hasStarted = !match.settled && new Date(match.match_date) <= new Date()
        return (
          <div
            key={match.match_id}
            onClick={() => !match.settled && !hasStarted && setActiveMatch(match)}
            className={match.settled || hasStarted ? 'cursor-default' : 'cursor-pointer'}
          >
            <MatchCard match={match} hasStarted={hasStarted} onShowBets={() => setBetsMatch(match)} />
          </div>
        )
      })}

      {activeMatch && (
        <BetModal
          match={activeMatch}
          userId={userId}
          onClose={() => setActiveMatch(null)}
          onSuccess={handleSuccess}
        />
      )}

      {betsMatch && (
        <MatchBetsPanel match={betsMatch} onClose={() => setBetsMatch(null)} />
      )}
    </>
  )
}
