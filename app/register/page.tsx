'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register, type AuthState } from '@/app/actions/auth'
import { Logo } from '@/components/Logo'

export default function RegisterPage() {
  const [state, action, isPending] = useActionState<AuthState, FormData>(register, null)

  return (
    <main className="min-h-screen bg-page text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-3">
            <Logo size={48} />
          </div>
          <h1 className="text-2xl font-bold">Registrer deg</h1>
        </div>

        {state && 'message' in state ? (
          <div className="bg-green-950 border border-green-800 text-green-300 rounded-xl p-4 text-center text-sm">
            {state.message}
          </div>
        ) : (
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
              <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
                E-post
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                placeholder="deg@eksempel.no"
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
                autoComplete="new-password"
                minLength={6}
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
              {isPending ? 'Registrerer...' : 'Registrer deg'}
            </button>
          </form>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          Har du allerede en konto?{' '}
          <Link href="/login" className="text-white hover:underline">
            Logg inn
          </Link>
        </p>
      </div>
    </main>
  )
}
