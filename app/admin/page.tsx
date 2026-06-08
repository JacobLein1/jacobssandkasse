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
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">Admin</h1>
              <p className="text-gray-400 text-sm mt-0.5">Brukere og saldoer</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/resultater" className="text-red-400 hover:text-red-300 text-sm transition-colors">
              Resultater →
            </Link>
            <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
              ← Tilbake
            </Link>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Bruker</th>
                <th className="text-right px-5 py-3 text-gray-400 font-medium">Saldo</th>
                <th className="text-right px-5 py-3 text-gray-400 font-medium">Juster</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-b border-gray-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-900/50'}`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.username ?? '(ingen)'}</span>
                      {u.is_admin && (
                        <span className="text-xs bg-red-700/40 text-red-300 rounded px-1.5 py-0.5">
                          admin
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5 font-mono">{u.id.slice(0, 8)}…</div>
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-semibold">
                    kr {Number(u.balance).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <BalanceEditor userId={u.id} currentBalance={Number(u.balance)} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-500">
                    Ingen brukere funnet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-gray-600 text-xs mt-4 text-center">
          Positivt beløp legger til, negativt trekker fra saldo.
        </p>
      </div>
    </main>
  )
}
