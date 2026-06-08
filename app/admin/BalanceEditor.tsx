'use client'

import { useActionState } from 'react'
import { updateBalance, type AdminState } from '@/app/actions/admin'

interface Props {
  userId: string
  currentBalance: number
}

export function BalanceEditor({ userId, currentBalance }: Props) {
  const [state, action, isPending] = useActionState<AdminState, FormData>(updateBalance, null)

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="amount"
        type="number"
        step="0.01"
        placeholder="±beløp"
        required
        className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap"
      >
        {isPending ? '...' : 'Oppdater'}
      </button>
      {state && 'error' in state && (
        <span className="text-red-400 text-xs">{state.error}</span>
      )}
      {state && 'success' in state && (
        <span className="text-green-400 text-xs">✓</span>
      )}
    </form>
  )
}
