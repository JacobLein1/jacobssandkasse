'use client'

import { useActionState } from 'react'
import { createCustomBet, type CustomBetState } from '@/app/actions/custom-bets'
import { flag } from '@/lib/flags'

interface Match {
  match_id: string
  home_team: string
  away_team: string
  match_date: string
}

const inputCls = 'w-full bg-detail border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-500'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Oslo',
  })
}

export function NewBetForm({ matches }: { matches: Match[] }) {
  const [state, action, isPending] = useActionState<CustomBetState, FormData>(createCustomBet, null)

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Tittel</label>
        <input name="title" required placeholder="f.eks. Norge scorer mer enn 2 mål i VM" className={inputCls} />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Beskrivelse</label>
        <textarea name="description" required rows={3} placeholder="Beskriv bettet tydelig — hva avgjør utfallet?"
          className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Påstand</label>
        <input name="creator_side" required placeholder="f.eks. Norge scorer over 2,5 mål" className={inputCls} />
        <p className="text-xs text-muted mt-1.5">Den som aksepterer mener automatisk det motsatte.</p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Innsats (kr)</label>
        <input
          name="amount" type="number" min="10" step="10" required placeholder="Minst 10 kr"
          className={`${inputCls} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        />
        <p className="text-xs text-muted mt-1.5">Trekkes fra saldo nå. Vinneren får 2× tilbake.</p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1.5">Tilknyttet kamp (valgfritt)</label>
        <select name="match_id" className={`${inputCls} bg-detail`}>
          <option value="">Ingen kamp — fritt bet</option>
          {matches.map(m => (
            <option key={m.match_id} value={m.match_id}>
              {flag(m.home_team)} {m.home_team} vs {m.away_team} {flag(m.away_team)} · {fmtDate(m.match_date)}
            </option>
          ))}
        </select>
      </div>

      {state && 'error' in state && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}

      <button type="submit" disabled={isPending}
        className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-4 py-3 font-semibold text-sm transition-colors">
        {isPending ? 'Oppretter...' : 'Opprett bet'}
      </button>
    </form>
  )
}
