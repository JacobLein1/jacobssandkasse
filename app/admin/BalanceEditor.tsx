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
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex gap-2">
        <input
          name="amount"
          type="number"
          step="0.01"
          placeholder="±beløp (f.eks. 100 eller -50)"
          required
          className="flex-1 min-w-0 bg-detail border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-xl px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
        >
          {isPending ? '...' : 'Oppdater'}
        </button>
      </div>
      {state && 'error' in state && (
        <p className="text-red-400 text-xs">{state.error}</p>
      )}
      {state && 'success' in state && (
        <p className="text-green-400 text-xs">✓ Saldo oppdatert</p>
      )}
    </form>
  )
}
