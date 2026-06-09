'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { resolveCustomBet, type CustomBetState } from '@/app/actions/custom-bets'

interface Props {
  betId: number
  creatorName: string
  opponentName: string
}

export function ResolveButtons({ betId, creatorName, opponentName }: Props) {
  const router = useRouter()
  const [state, action, isPending] = useActionState<CustomBetState, FormData>(resolveCustomBet, null)

  useEffect(() => {
    if (state && 'success' in state) router.refresh()
  }, [state, router])

  return (
    <div>
      {state && 'error' in state && (
        <p className="text-red-400 text-xs mb-2">{state.error}</p>
      )}
      <div className="flex gap-2 flex-wrap">
        <form action={action}>
          <input type="hidden" name="bet_id" value={betId} />
          <input type="hidden" name="winner" value="creator" />
          <button type="submit" disabled={isPending}
            className="bg-green-900/40 hover:bg-green-900/60 text-green-400 text-xs font-medium rounded-lg px-3 py-2 transition-colors disabled:opacity-50">
            {creatorName} vant
          </button>
        </form>
        <form action={action}>
          <input type="hidden" name="bet_id" value={betId} />
          <input type="hidden" name="winner" value="opponent" />
          <button type="submit" disabled={isPending}
            className="bg-blue-900/40 hover:bg-blue-900/60 text-blue-400 text-xs font-medium rounded-lg px-3 py-2 transition-colors disabled:opacity-50">
            {opponentName} vant
          </button>
        </form>
      </div>
    </div>
  )
}
