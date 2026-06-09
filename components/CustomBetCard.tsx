'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { acceptCustomBet, cancelCustomBet, updateCustomBet, deleteCustomBet, type CustomBetState } from '@/app/actions/custom-bets'
import { flag } from '@/lib/flags'

export interface EnrichedCustomBet {
  id: number
  creator_id: string
  match_id: string | null
  title: string
  description: string
  creator_side: string
  amount: number
  status: 'open' | 'matched' | 'pending_result' | 'won_creator' | 'won_opponent' | 'cancelled'
  opponent_id: string | null
  created_at: string
  matched_at: string | null
  creator_username: string | null
  opponent_username: string | null
  match_home_team: string | null
  match_away_team: string | null
  match_date: string | null
}

interface Props {
  bet: EnrichedCustomBet
  userId: string | null
  isAdmin?: boolean
}

const inputCls = 'w-full bg-detail border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500'

function StatusBadge({ status }: { status: EnrichedCustomBet['status'] }) {
  switch (status) {
    case 'open':
      return <span className="text-xs font-semibold bg-green-900/40 text-green-400 rounded-full px-2.5 py-1 shrink-0">Åpen</span>
    case 'matched':
      return <span className="text-xs font-semibold bg-yellow-900/40 text-yellow-400 rounded-full px-2.5 py-1 shrink-0">Låst</span>
    case 'won_creator':
    case 'won_opponent':
      return <span className="text-xs font-semibold bg-detail text-gray-400 rounded-full px-2.5 py-1 shrink-0">Avgjort</span>
    case 'cancelled':
      return <span className="text-xs font-semibold bg-detail text-gray-500 rounded-full px-2.5 py-1 shrink-0">Avbrutt</span>
    default:
      return null
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: 'numeric', month: 'short', timeZone: 'Europe/Oslo',
  })
}

export function CustomBetCard({ bet, userId, isAdmin }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)

  const [acceptState, acceptAction, isAccepting] = useActionState<CustomBetState, FormData>(acceptCustomBet, null)
  const [cancelState, cancelAction, isCancelling] = useActionState<CustomBetState, FormData>(cancelCustomBet, null)
  const [editState, editAction, isSaving] = useActionState<CustomBetState, FormData>(updateCustomBet, null)
  const [deleteState, deleteAction, isDeleting] = useActionState<CustomBetState, FormData>(deleteCustomBet, null)

  useEffect(() => {
    if (acceptState && 'success' in acceptState) router.refresh()
  }, [acceptState, router])

  useEffect(() => {
    if (cancelState && 'success' in cancelState) router.refresh()
  }, [cancelState, router])

  useEffect(() => {
    if (editState && 'success' in editState) { setEditOpen(false); router.refresh() }
  }, [editState, router])

  useEffect(() => {
    if (deleteState && 'success' in deleteState) router.refresh()
  }, [deleteState, router])

  const isCreator = userId === bet.creator_id
  const isMatched = bet.status === 'matched'
  const isOpen = bet.status === 'open'
  const isSettled = ['won_creator', 'won_opponent', 'cancelled'].includes(bet.status)

  const winnerName = bet.status === 'won_creator'
    ? bet.creator_username
    : bet.status === 'won_opponent'
    ? bet.opponent_username
    : null

  return (
    <article className={`bg-card border border-gray-800 rounded-2xl p-5 mb-4 ${isSettled ? 'opacity-55' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-bold text-base leading-tight">{bet.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={bet.status} />
          {isAdmin && (
            <form action={deleteAction}>
              <input type="hidden" name="bet_id" value={bet.id} />
              <button
                type="submit"
                disabled={isDeleting}
                onClick={e => { if (!confirm('Slette og refundere innsats?')) e.preventDefault() }}
                className="text-gray-600 hover:text-red-400 disabled:opacity-50 text-sm transition-colors"
                title="Slett bet"
              >
                ✕
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-4 leading-relaxed">{bet.description}</p>

      {/* Claim */}
      <div className="bg-detail rounded-xl px-4 py-3 mb-4">
        <p className="text-xs text-muted mb-1">Påstand</p>
        <p className="text-sm font-semibold">{bet.creator_side}</p>
        {isOpen && (
          <p className="text-xs text-muted mt-1">Den som aksepterer mener det motsatte.</p>
        )}
        {isMatched && bet.opponent_username && (
          <p className="text-xs text-muted mt-1">{bet.opponent_username} har tatt imot dette bettet.</p>
        )}
      </div>

      {/* Match info */}
      {bet.match_home_team && bet.match_away_team && (
        <p className="text-xs text-muted mb-3">
          {flag(bet.match_home_team)} {bet.match_home_team} vs {bet.match_away_team} {flag(bet.match_away_team)}
          {bet.match_date && ` · ${fmtDate(bet.match_date)}`}
        </p>
      )}
      {!bet.match_id && (
        <p className="text-xs text-muted mb-3">Fri bet — ikke tilknyttet kamp</p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs mb-4">
        <span className="text-muted">
          {bet.creator_username ?? 'ukjent'}
          {winnerName && <span className="ml-1 text-green-400 font-semibold">· {winnerName} vant 🏆</span>}
        </span>
        <span className="font-mono font-bold text-white">kr {Number(bet.amount).toFixed(0)} × 2</span>
      </div>

      {deleteState && 'error' in deleteState && (
        <p className="text-red-400 text-xs mb-3">{deleteState.error}</p>
      )}

      {/* Inline edit form */}
      {editOpen && (
        <form action={editAction} className="border-t border-gray-800 pt-4 space-y-3">
          <input type="hidden" name="bet_id" value={bet.id} />
          <input name="title" defaultValue={bet.title} required placeholder="Tittel" className={inputCls} />
          <textarea
            name="description" defaultValue={bet.description} required rows={2}
            placeholder="Beskrivelse"
            className={`${inputCls} resize-none`}
          />
          <input name="creator_side" defaultValue={bet.creator_side} required placeholder="Påstand" className={inputCls} />
          <input
            name="amount" type="number" min="10" step="10" defaultValue={bet.amount} required
            placeholder="Beløp (kr)"
            className={`${inputCls} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
          />
          {editState && 'error' in editState && (
            <p className="text-red-400 text-xs">{editState.error}</p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={isSaving}
              className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-xl py-2 text-sm font-semibold transition-colors">
              {isSaving ? '...' : 'Lagre endringer'}
            </button>
            <button type="button" onClick={() => setEditOpen(false)}
              className="flex-1 bg-detail hover:bg-gray-700 rounded-xl py-2 text-sm transition-colors">
              Avbryt
            </button>
          </div>
        </form>
      )}

      {/* Action buttons */}
      {!editOpen && !isSettled && (
        <div className="flex gap-2 flex-wrap">
          {isOpen && !isCreator && (
            <form action={acceptAction} className="flex-1 min-w-[120px]">
              <input type="hidden" name="bet_id" value={bet.id} />
              {acceptState && 'error' in acceptState && (
                <p className="text-red-400 text-xs mb-1.5">{acceptState.error}</p>
              )}
              <button type="submit" disabled={isAccepting || !userId}
                className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-2 text-sm font-semibold transition-colors">
                {isAccepting ? '...' : userId ? 'Aksepter — jeg mener det motsatte' : 'Logg inn for å akseptere'}
              </button>
            </form>
          )}

          {isOpen && isCreator && (
            <>
              <button onClick={() => setEditOpen(true)}
                className="flex-1 bg-detail hover:bg-gray-700 rounded-xl py-2 text-sm font-medium transition-colors">
                Rediger
              </button>
              <form action={cancelAction}>
                <input type="hidden" name="bet_id" value={bet.id} />
                {cancelState && 'error' in cancelState && (
                  <p className="text-red-400 text-xs mb-1.5">{cancelState.error}</p>
                )}
                <button type="submit" disabled={isCancelling}
                  onClick={e => { if (!confirm('Avbryte bettet? Du får innsatsen refundert.')) e.preventDefault() }}
                  className="bg-detail hover:bg-gray-700 disabled:opacity-50 rounded-xl py-2 px-4 text-sm text-red-400 transition-colors">
                  {isCancelling ? '...' : 'Avbryt bet'}
                </button>
              </form>
            </>
          )}

          {isMatched && (
            <p className="text-xs text-muted w-full pt-1">
              Bettet er låst — admin avgjør resultatet.
            </p>
          )}
        </div>
      )}
    </article>
  )
}
