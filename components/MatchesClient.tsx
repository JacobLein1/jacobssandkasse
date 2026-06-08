'use client'

import { useState } from 'react'
import { MatchList, type MatchOdds } from '@/components/MatchList'
import { flag } from '@/lib/flags'

interface Props {
  matches: MatchOdds[]
  userId: string | null
}

export function MatchesClient({ matches, userId }: Props) {
  const [activeTeam, setActiveTeam] = useState<string | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)

  const teams = [...new Set(matches.flatMap(m => [m.home_team, m.away_team]))].sort()

  const filtered = activeTeam
    ? matches.filter(m => m.home_team === activeTeam || m.away_team === activeTeam)
    : matches

  return (
    <>
      <button
        onClick={() => setInfoOpen(o => !o)}
        className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 mb-5 transition-colors hover:border-gray-700"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300 font-medium">ℹ️ Hvordan fungerer dette?</span>
          <span className="text-gray-600 text-xs">{infoOpen ? '▲' : '▼'}</span>
        </div>
        {infoOpen && (
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            Alle brukere starter med <span className="text-white font-medium">1000 kr</span> i virtuell saldo og kan bette på VM-kampene. Velg en kamp, velg utfall og innsats — gevinster utbetales automatisk når resultatet er lagt inn. Man kan se andre spilleres saldo under 'Ledertavle', og det er om å samle mest penger innen VM.
          </p>
        )}
      </button>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveTeam(null)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${activeTeam === null
            ? 'bg-red-700 text-white'
            : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
        >
          Alle land
        </button>
        {teams.map(team => (
          <button
            key={team}
            onClick={() => setActiveTeam(activeTeam === team ? null : team)}
            className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${activeTeam === team
              ? 'bg-red-700 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
          >
            <span>{flag(team)}</span>
            <span>{team}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        {filtered.length} {filtered.length === 1 ? 'kamp' : 'kamper'}
        {activeTeam && ` · ${activeTeam}`}
      </p>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-16 text-sm">Ingen kamper funnet.</p>
      )}

      <MatchList matches={filtered} userId={userId} />
    </>
  )
}
