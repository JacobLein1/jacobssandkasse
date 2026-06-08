'use client'

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import { placeBet } from '@/app/actions/bets'
import { flag } from '@/lib/flags'
import type { TotalsMap } from '@/components/MatchList'

export interface BetMatch {
  match_id: string
  home_team: string
  away_team: string
  home_odds: number | null
  draw_odds: number | null
  away_odds: number | null
  totals: TotalsMap | null
}

interface BetModalProps {
  match: BetMatch
  userId: string | null
  onClose: () => void
  onSuccess: () => void
}

function fmt(odds: number | null): string {
  return odds != null ? odds.toFixed(2) : '—'
}

export function BetModal({ match, userId, onClose, onSuccess }: BetModalProps) {
  // Sorted lines — stable for this match instance
  const totalsLines = match.totals
    ? Object.entries(match.totals).sort(([a], [b]) => parseFloat(a) - parseFloat(b))
    : []

  const [sliderIndex, setSliderIndex] = useState(() => {
    const idx = totalsLines.findIndex(([k]) => k === '2.5')
    return idx >= 0 ? idx : Math.max(0, Math.floor((totalsLines.length - 1) / 2))
  })
  const [outcome, setOutcome] = useState<'home' | 'draw' | 'away' | 'over' | 'under' | null>(null)
  const [selectedLine, setSelectedLine] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [state, formAction, isPending] = useActionState(placeBet, null)

  useEffect(() => {
    if (state && 'success' in state) onSuccess()
  }, [state, onSuccess])

  const currentLine = totalsLines[sliderIndex]?.[0] ?? null
  const currentLineOdds = totalsLines[sliderIndex]?.[1] ?? {}

  const handleSliderChange = (idx: number) => {
    setSliderIndex(idx)
    // If the user already chose over/under, keep that side but move to the new line
    if ((outcome === 'over' || outcome === 'under') && totalsLines[idx]) {
      setSelectedLine(totalsLines[idx][0])
    }
  }

  const selectedOdds =
    outcome === 'home' ? match.home_odds :
    outcome === 'draw' ? match.draw_odds :
    outcome === 'away' ? match.away_odds :
    (outcome === 'over' || outcome === 'under') && selectedLine
      ? (match.totals?.[selectedLine]?.[outcome] ?? null)
      : null

  const amountNum = parseFloat(amount)
  const potentialWin =
    selectedOdds != null && !isNaN(amountNum) && amountNum >= 10
      ? amountNum * selectedOdds
      : null

  const h2hOutcomes: Array<{ key: 'home' | 'draw' | 'away'; label: string; odds: number | null }> = [
    { key: 'home', label: match.home_team, odds: match.home_odds },
    { key: 'draw', label: 'Uavgjort', odds: match.draw_odds },
    { key: 'away', label: match.away_team, odds: match.away_odds },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Legg inn spill</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white text-2xl leading-none transition-colors"
            aria-label="Lukk"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-400 text-center mb-5">
          {flag(match.home_team)} {match.home_team}&nbsp;&nbsp;vs&nbsp;&nbsp;{match.away_team} {flag(match.away_team)}
        </p>

        {!userId ? (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-5 text-sm">Du må logge inn for å spille</p>
            <Link
              href="/login"
              className="bg-red-700 hover:bg-red-600 text-white text-sm font-semibold rounded-xl px-6 py-2.5 transition-colors inline-block"
            >
              Logg inn
            </Link>
          </div>
        ) : (
          <form action={formAction}>
            <input type="hidden" name="match_id" value={match.match_id} />
            <input type="hidden" name="home_team" value={match.home_team} />
            <input type="hidden" name="away_team" value={match.away_team} />
            <input type="hidden" name="outcome" value={outcome ?? ''} />
            <input type="hidden" name="odds" value={String(selectedOdds ?? '')} />
            <input type="hidden" name="totals_line" value={selectedLine ?? ''} />

            {/* H2H outcome buttons */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {h2hOutcomes.map(({ key, label, odds }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOutcome(key)}
                  className={`flex flex-col items-center rounded-xl px-2 py-3 gap-1 border transition-colors ${
                    outcome === key
                      ? 'bg-red-700 border-red-600'
                      : 'bg-gray-800 border-transparent hover:border-gray-600'
                  }`}
                >
                  <span className="text-xs text-gray-300 text-center leading-tight truncate max-w-full">
                    {label}
                  </span>
                  <span className="text-xl font-bold tabular-nums">{fmt(odds)}</span>
                </button>
              ))}
            </div>

            {/* Over/Under slider */}
            {totalsLines.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-4 mb-5">
                {/* Current line label */}
                <div className="text-center mb-3">
                  <span className="text-base font-bold tabular-nums">{currentLine}</span>
                  <span className="text-xs text-gray-400 ml-1.5">mål</span>
                </div>

                {/* Slider — only shown when there are multiple lines */}
                {totalsLines.length > 1 && (
                  <div className="mb-4 px-1">
                    <input
                      type="range"
                      min={0}
                      max={totalsLines.length - 1}
                      step={1}
                      value={sliderIndex}
                      onChange={e => handleSliderChange(parseInt(e.target.value, 10))}
                      className="totals-slider"
                    />
                    <div className="flex justify-between mt-1.5">
                      {totalsLines.map(([line], i) => (
                        <span
                          key={line}
                          className={`text-xs transition-colors ${
                            sliderIndex === i ? 'text-white font-semibold' : 'text-gray-500'
                          }`}
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Over / Under buttons for active line */}
                <div className="grid grid-cols-2 gap-2">
                  {(['over', 'under'] as const).map(side => {
                    const isActive = outcome === side && selectedLine === currentLine
                    const odds = side === 'over' ? currentLineOdds.over : currentLineOdds.under
                    return (
                      <button
                        key={side}
                        type="button"
                        onClick={() => { setOutcome(side); setSelectedLine(currentLine) }}
                        className={`flex flex-col items-center rounded-xl px-2 py-3 gap-1 border transition-colors ${
                          isActive
                            ? 'bg-red-700 border-red-600'
                            : 'bg-gray-900 border-transparent hover:border-gray-600'
                        }`}
                      >
                        <span className="text-xs text-gray-400">
                          {side === 'over' ? 'Over' : 'Under'} {currentLine}
                        </span>
                        <span className="text-xl font-bold tabular-nums">
                          {fmt(odds ?? null)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {totalsLines.length === 0 && <div className="mb-5" />}

            {/* Amount input */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1.5 block">Innsats (kr)</label>
              <input
                type="number"
                name="amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onWheel={e => (e.target as HTMLInputElement).blur()}
                min="10"
                step="10"
                placeholder="Minst 10 kr"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-600 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>

            {/* Potential win */}
            <div
              className={`flex justify-between text-sm mb-5 px-1 ${
                potentialWin ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              <span>Mulig gevinst</span>
              <span className="font-mono font-semibold">
                {potentialWin ? `kr ${potentialWin.toFixed(2)}` : '—'}
              </span>
            </div>

            {/* Error */}
            {state && 'error' in state && (
              <p className="text-red-400 text-sm text-center mb-4">{state.error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!outcome || !amount || isPending}
              className="w-full bg-red-700 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              {isPending ? 'Legger inn...' : 'Legg inn spill'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
