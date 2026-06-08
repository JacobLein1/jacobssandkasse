'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login, type AuthState } from '@/app/actions/auth'
import { Logo } from '@/components/Logo'

export default function LoginPage() {
  const [state, action, isPending] = useActionState<AuthState, FormData>(login, null)

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-3">
            <Logo size={48} />
          </div>
          <h1 className="text-2xl font-bold">Logg inn</h1>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm text-gray-400 mb-1">
              Brukernavn
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
              placeholder="dittbrukernavn"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
              Passord
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
              placeholder="••••••••"
            />
          </div>

          {state && 'error' in state && (
            <p className="text-red-400 text-sm">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl px-4 py-3 font-semibold transition-colors"
          >
            {isPending ? 'Logger inn...' : 'Logg inn'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Ingen konto?{' '}
          <Link href="/register" className="text-white hover:underline">
            Registrer deg
          </Link>
        </p>
      </div>
    </main>
  )
}
