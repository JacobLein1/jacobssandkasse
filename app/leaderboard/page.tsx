import { createClient as createServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Logo } from '@/components/Logo'

interface Profile {
  id: string
  username: string | null
  balance: number
  total_wagered: number
}

const STARTING_BALANCE = 1000
const MEDALS = ['🥇', '🥈', '🥉']

async function getLeaderboard(): Promise<Profile[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, balance, total_wagered')
    .order('balance', { ascending: false })
  if (error) throw error
  return data ?? []
}

export default async function LeaderboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profiles: Profile[] = []
  let fetchError: string | null = null

  try {
    profiles = await getLeaderboard()
  } catch {
    fetchError = 'Kunne ikke laste ledertavlen.'
  }

  return (
    <main className="min-h-screen bg-page text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        <p className="text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 mb-6">
          Trykk på et brukernavn for å se deres avgjorte spill.
        </p>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">🏆 Ledertavle</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Startbalanse: 1&nbsp;000&nbsp;kr
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Tilbake
          </Link>
        </div>

        {fetchError && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-4 text-center text-sm mb-6">
            {fetchError}
          </div>
        )}

        {!fetchError && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {profiles.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-500 text-sm">
                Ingen brukere ennå.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-center px-4 py-3 text-gray-400 font-medium w-12">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Bruker
                    </th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">
                      Saldo
                    </th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium hidden sm:table-cell">
                      Spilt
                    </th>
                    <th className="text-right px-4 py-3 text-gray-400 font-medium">
                      +/−
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile, i) => {
                    const isMe = user?.id === profile.id
                    const diff = Number(profile.balance) - STARTING_BALANCE
                    const medal = MEDALS[i] ?? null
                    return (
                      <tr
                        key={profile.id}
                        className={`border-b border-gray-800 last:border-0 ${
                          isMe
                            ? 'bg-red-950/40'
                            : i % 2 !== 0
                            ? 'bg-gray-900/50'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-center text-base">
                          {medal ?? (
                            <span className="text-gray-500">{i + 1}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {profile.username ? (
                            <Link
                              href={`/leaderboard/${encodeURIComponent(profile.username)}`}
                              className={`font-medium hover:underline ${isMe ? 'text-red-300' : 'hover:text-white'}`}
                            >
                              {profile.username}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-500">(anonym)</span>
                          )}
                          {isMe && (
                            <span className="ml-2 text-xs text-red-500">deg</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          kr {Number(profile.balance).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-gray-400 hidden sm:table-cell">
                          kr {Number(profile.total_wagered).toFixed(2)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono text-sm ${
                            diff > 0
                              ? 'text-green-400'
                              : diff < 0
                              ? 'text-red-400'
                              : 'text-gray-500'
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {diff.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
