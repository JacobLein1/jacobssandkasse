'use client'

import { useActionState } from 'react'
import { settleMatch, type ResultState } from '@/app/actions/results'

interface Props {
  matchId: string
}

export function ResultsEditor({ matchId }: Props) {
  const [state, action, isPending] = useActionState<ResultState, FormData>(settleMatch, null)

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="match_id" value={matchId} />
      <input
        name="home_goals"
        type="number"
        min="0"
        placeholder="Hjem"
        required
        className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-gray-500 text-sm">–</span>
      <input
        name="away_goals"
        type="number"
        min="0"
        placeholder="Borte"
        required
        className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap"
      >
        {isPending ? '...' : 'Lagre & avgjør'}
      </button>
      {state && 'error' in state && (
        <span className="text-red-400 text-xs w-full">{state.error}</span>
      )}
      {state && 'success' in state && (
        <span className="text-green-400 text-xs">
          ✓ {state.won} vunnet · {state.lost} tapt
        </span>
      )}
    </form>
  )
}
