import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import type { MatchOdds } from '@/components/MatchList'
import { MatchesClient } from '@/components/MatchesClient'
import { Logo } from '@/components/Logo'
import { LogoutButton } from '@/components/LogoutButton'

async function getAllMatches(): Promise<MatchOdds[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase
    .from('odds')
    .select('*')
    .order('match_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

interface Profile {
  username: string | null
  balance: number
  is_admin: boolean
}

async function getProfile(): Promise<{ user: { id: string } | null; profile: Profile | null }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data } = await supabase
    .from('profiles')
    .select('username, balance, is_admin')
    .eq('id', user.id)
    .single()

  return { user, profile: data }
}

export default async function Home() {
  const [{ user, profile }, matchResult] = await Promise.all([
    getProfile(),
    getAllMatches()
      .then(m => ({ matches: m, error: null }))
      .catch(() => ({ matches: [] as MatchOdds[], error: 'Kunne ikke laste kamper.' })),
  ])

  const { matches, error: fetchError } = matchResult

  return (
    <main className="min-h-screen bg-page text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          {/* Row 1: logo + user info */}
          <div className="flex items-center gap-3 mb-3">
            <Logo />
            {user && profile ? (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{profile.username}</p>
                  <p className="text-gray-400 text-xs">kr {Number(profile.balance).toFixed(2)}</p>
                </div>
                {profile.is_admin && (
                  <Link
                    href="/admin"
                    className="text-xs bg-red-700/40 text-red-300 rounded-lg px-2.5 py-1.5 hover:bg-red-700/60 transition-colors font-medium whitespace-nowrap"
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <span className="flex-1" />
            )}
          </div>

          {/* Row 2: nav buttons */}
          {user && profile ? (
            <div className="flex gap-2">
              <Link href="/leaderboard"
                className="flex-1 bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 text-center transition-colors">
                🏆 Ledertavle
              </Link>
              <Link href="/bets"
                className="flex-1 bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 text-center transition-colors">
                Bets
              </Link>
              <Link href="/mine-spill"
                className="flex-1 bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 text-center transition-colors">
                Mine spill
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/leaderboard"
                className="flex-1 bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 text-center transition-colors">
                🏆 Ledertavle
              </Link>
              <Link href="/login"
                className="flex-1 bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 text-center transition-colors">
                Logg inn
              </Link>
              <Link href="/register"
                className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-xl px-3 py-2 text-center transition-colors">
                Registrer deg
              </Link>
            </div>
          )}
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">VM-kamper 2026</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {matches.length > 0 ? `${matches.length} kamper` : 'Alle kamper'} · sortert etter dato
          </p>
        </div>

        {fetchError && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-4 text-center text-sm mb-6">
            {fetchError}
          </div>
        )}

        {!fetchError && (
          <MatchesClient matches={matches} userId={user?.id ?? null} />
        )}
      </div>
    </main>
  )
}
