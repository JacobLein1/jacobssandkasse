'use client'

import { useState } from 'react'
import { CustomBetCard, type EnrichedCustomBet } from '@/components/CustomBetCard'

interface Props {
  bets: EnrichedCustomBet[]
  userId: string | null
  isAdmin: boolean
  todayStr: string
}

type StatusFilter = 'alle' | 'match' | 'fri'
type Tab = 'alle' | 'mine'

export function CustomBetFeed({ bets, userId, isAdmin, todayStr }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('alle')
  const [tab, setTab] = useState<Tab>('alle')

  const byTab = tab === 'mine'
    ? bets.filter(b => b.creator_id === userId || b.opponent_id === userId)
    : bets.filter(b => b.status === 'open' || b.status === 'matched')

  const visible = byTab
    .filter(b => {
      if (filter === 'fri') return !b.match_id
      if (filter === 'match') return !!b.match_id && !!b.match_date && b.match_date.startsWith(todayStr)
      return true
    })
    .sort((a, b) => {
      if (a.status === 'open' && b.status !== 'open') return -1
      if (a.status !== 'open' && b.status === 'open') return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const openCount = bets.filter(b => b.status === 'open').length
  const mineCount = userId ? bets.filter(b => b.creator_id === userId || b.opponent_id === userId).length : 0

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 bg-detail rounded-xl p-1 mb-4">
        {([['alle', `Alle (${openCount} åpne)`], ['mine', `Mine bets${mineCount > 0 ? ` (${mineCount})` : ''}`]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
              tab === t ? 'bg-card text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {([['alle', 'Alle'], ['match', 'Dagens kamper'], ['fri', 'Frie bets']] as [StatusFilter, string][]).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              filter === val ? 'bg-red-700 text-white' : 'bg-detail text-gray-400 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-center text-gray-500 py-16 text-sm">
          {tab === 'mine' && !userId ? 'Logg inn for å se dine bets.' :
           tab === 'mine' ? 'Du har ingen bets ennå.' :
           'Ingen bets funnet.'}
        </p>
      ) : (
        visible.map(bet => <CustomBetCard key={bet.id} bet={bet} userId={userId} isAdmin={isAdmin} />)
      )}
    </>
  )
}
