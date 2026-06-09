import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BalanceEditor } from './BalanceEditor'
import { Logo } from '@/components/Logo'

interface Profile {
  id: string
  username: string | null
  balance: number
  is_admin: boolean
  created_at: string
}

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: caller } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!caller?.is_admin) redirect('/')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, balance, is_admin, created_at')
    .order('username', { ascending: true })

  const users = (profiles ?? []) as Profile[]

  return (
    <main className="min-h-screen bg-page text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">Admin</h1>
              <p className="text-gray-400 text-sm mt-0.5">Brukere og saldoer</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/custom-bets"
              className="flex flex-1 items-center justify-center bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 transition-colors">
              Custom Bets
            </Link>
            <Link href="/admin/resultater"
              className="flex flex-1 items-center justify-center bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 transition-colors">
              Resultater
            </Link>
            <Link href="/"
              className="flex flex-1 items-center justify-center bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 transition-colors">
              ← Tilbake
            </Link>
          </div>
        </div>

        <p className="text-gray-600 text-xs mb-4 text-center">
          Positivt beløp legger til, negativt trekker fra saldo.
        </p>

        {users.length === 0 && (
          <p className="text-center text-gray-500 py-16 text-sm">Ingen brukere funnet.</p>
        )}

        {users.map(u => (
          <div key={u.id} className="bg-card border border-gray-800 rounded-2xl p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{u.username ?? '(ingen)'}</span>
                  {u.is_admin && (
                    <span className="text-xs bg-red-700/40 text-red-300 rounded px-1.5 py-0.5">admin</span>
                  )}
                </div>
                <div className="text-gray-500 text-xs mt-0.5 font-mono">{u.id.slice(0, 8)}…</div>
              </div>
              <span className="font-mono font-semibold">kr {Number(u.balance).toFixed(2)}</span>
            </div>
            <BalanceEditor userId={u.id} currentBalance={Number(u.balance)} />
          </div>
        ))}
      </div>
    </main>
  )
}
