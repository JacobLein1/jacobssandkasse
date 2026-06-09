'use client'

import { useState } from 'react'
import Link from 'next/link'
import { flag } from '@/lib/flags'

export interface RegularBet {
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

export interface EnrichedCustomBet {
  id: number
  title: string
  description: string
  creator_side: string
  amount: number
  status: 'open' | 'matched' | 'pending_result' | 'won_creator' | 'won_opponent' | 'cancelled'
  creator_id: string
  opponent_id: string | null
  match_id: string | null
  otherUsername: string | null
  matchHomeTeam: string | null
  matchAwayTeam: string | null
}

type Filter = 'alle' | 'aktive' | 'avgjorte'
type TypeFilter = 'begge' | 'vanlige' | 'custom'

function outcomeLabel(bet: RegularBet): string {
  switch (bet.outcome) {
    case 'home':  return `${bet.home_team} vinner`
    case 'draw':  return 'Uavgjort'
    case 'away':  return `${bet.away_team} vinner`
    case 'over':  return `Over ${bet.totals_line ?? ''} mål`
    case 'under': return `Under ${bet.totals_line ?? ''} mål`
    default:      return bet.outcome
  }
}

function BetStatusBadge({ status }: { status: RegularBet['status'] }) {
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

function CustomStatusBadge({ status, isCreator }: { status: EnrichedCustomBet['status']; isCreator: boolean }) {
  const won = (status === 'won_creator' && isCreator) || (status === 'won_opponent' && !isCreator)
  const lost = (status === 'won_creator' && !isCreator) || (status === 'won_opponent' && isCreator)
  if (won) return <span className="inline-block text-xs font-semibold bg-green-900/60 text-green-400 rounded-full px-2.5 py-0.5">Vunnet</span>
  if (lost) return <span className="inline-block text-xs font-semibold bg-red-900/60 text-red-400 rounded-full px-2.5 py-0.5">Tapt</span>
  if (status === 'matched') return <span className="inline-block text-xs font-semibold bg-yellow-900/60 text-yellow-400 rounded-full px-2.5 py-0.5">Låst</span>
  if (status === 'cancelled') return <span className="inline-block text-xs font-semibold bg-gray-800 text-gray-500 rounded-full px-2.5 py-0.5">Avbrutt</span>
  return <span className="inline-block text-xs font-semibold bg-yellow-900/60 text-yellow-400 rounded-full px-2.5 py-0.5">Åpen</span>
}

interface Props {
  bets: RegularBet[]
  customBets: EnrichedCustomBet[]
  userId: string
}

type SortBy = 'none' | 'gevinst' | 'tap'

function betResult(bet: RegularBet): number {
  if (bet.status === 'won') return Number(bet.potential_win)
  if (bet.status === 'lost') return -Number(bet.amount)
  return Number(bet.potential_win)
}

export function MineSpillClient({ bets, customBets, userId }: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('begge')
  const [filter, setFilter] = useState<Filter>('alle')
  const [sortBy, setSortBy] = useState<SortBy>('none')

  const activeBets = bets.filter(b => b.status === 'pending')
  const settledBets = bets.filter(b => b.status === 'won' || b.status === 'lost')
  const activeCustom = customBets.filter(b => b.status === 'open' || b.status === 'matched')
  const settledCustom = customBets.filter(b => ['won_creator', 'won_opponent', 'cancelled'].includes(b.status))

  const filteredBets = filter === 'aktive' ? activeBets : filter === 'avgjorte' ? settledBets : bets
  const visibleBets = sortBy === 'none'
    ? filteredBets
    : [...filteredBets].sort((a, b) =>
        sortBy === 'gevinst'
          ? betResult(b) - betResult(a)
          : betResult(a) - betResult(b)
      )
  const visibleCustom = filter === 'aktive' ? activeCustom : filter === 'avgjorte' ? settledCustom : customBets

  const totalAmount = bets.reduce((s, b) => s + Number(b.amount), 0)
  const totalWon = settledBets.filter(b => b.status === 'won').reduce((s, b) => s + Number(b.potential_win), 0)
  const netResult = totalWon - totalAmount

  const showBets = typeFilter !== 'custom'
  const showCustom = typeFilter !== 'vanlige'

  const typeOptions: [TypeFilter, string][] = [
    ['begge', 'Begge'],
    ['vanlige', `Vanlige (${bets.length})`],
    ['custom', `Custom (${customBets.length})`],
  ]

  const statusOptions: [Filter, string][] = [
    ['alle', 'Alle'],
    ['aktive', 'Aktive'],
    ['avgjorte', 'Avgjorte'],
  ]

  return (
    <>
      {/* Type filter */}
      <div className="flex gap-1 bg-detail rounded-xl p-1 mb-3">
        {typeOptions.map(([val, label]) => (
          <button key={val} onClick={() => setTypeFilter(val)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              typeFilter === val ? 'bg-card text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-1 bg-detail/50 rounded-xl p-1 mb-6">
        {statusOptions.map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              filter === val ? 'bg-card text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Vanlige spill ── */}
      {showBets && <h2 className="text-base font-semibold text-gray-300 mb-3">Vanlige spill</h2>}

      {showBets && settledBets.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSortBy(s => s === 'gevinst' ? 'none' : 'gevinst')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              sortBy === 'gevinst' ? 'bg-green-900/50 text-green-400 border border-green-800/60' : 'bg-detail text-gray-400 hover:text-white'
            }`}
          >
            Høyest gevinst
            <span className="font-mono text-xs">{sortBy === 'gevinst' ? '↑' : '—'}</span>
          </button>
          <button
            onClick={() => setSortBy(s => s === 'tap' ? 'none' : 'tap')}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              sortBy === 'tap' ? 'bg-red-900/40 text-red-400 border border-red-900/60' : 'bg-detail text-gray-400 hover:text-white'
            }`}
          >
            Høyest tap
            <span className="font-mono text-xs">{sortBy === 'tap' ? '↑' : '—'}</span>
          </button>
        </div>
      )}

      {showBets && bets.length > 0 && filter === 'alle' && (
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

      {showBets && (
        visibleBets.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8 mb-6">
            {filter === 'aktive' ? 'Ingen aktive vanlige spill.' :
             filter === 'avgjorte' ? 'Ingen avgjorte vanlige spill.' :
             <>Ingen vanlige spill ennå. <Link href="/" className="text-red-400 hover:text-red-300">Se kamper →</Link></>}
          </p>
        ) : (
          <div className="mb-8">
            {visibleBets.map(bet => (
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
        )
      )}

      {/* ── Custom bets ── */}
      {showCustom && <h2 className="text-base font-semibold text-gray-300 mb-3">Custom bets</h2>}

      {showCustom && (
        visibleCustom.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">
            {filter === 'aktive' ? 'Ingen aktive custom bets.' :
             filter === 'avgjorte' ? 'Ingen avgjorte custom bets.' :
             <>Ingen custom bets ennå. <Link href="/bets/new" className="text-red-400 hover:text-red-300">Opprett et bet →</Link></>}
          </p>
        ) : visibleCustom.map(bet => {
          const isCreator = bet.creator_id === userId
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
                <CustomStatusBadge status={bet.status} isCreator={isCreator} />
              </div>
              <div className="bg-detail rounded-xl px-3 py-2 mb-3">
                <p className="text-xs text-muted mb-0.5">Påstand</p>
                <p className="text-sm">{bet.creator_side}</p>
                {!isCreator && <p className="text-xs text-muted mt-1">Du tok imot — mente det motsatte.</p>}
              </div>
              {bet.matchHomeTeam && (
                <p className="text-xs text-muted mb-3">
                  {flag(bet.matchHomeTeam)} {bet.matchHomeTeam} vs {bet.matchAwayTeam} {flag(bet.matchAwayTeam ?? '')}
                </p>
              )}
              <div className="flex gap-4 text-xs text-gray-400 flex-wrap">
                <span>Mot <span className="text-white">{bet.otherUsername ?? (bet.status === 'open' ? 'ingen ennå' : 'ukjent')}</span></span>
                <span>Innsats <span className="text-white font-mono">kr {Number(bet.amount).toFixed(0)}</span></span>
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
    </>
  )
}
