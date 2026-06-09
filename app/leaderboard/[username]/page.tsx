import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { UserBetsView, type AllBet, type UserCustomBet } from '@/components/UserBetsView'

interface ProfileRow {
  id: string
  username: string | null
  balance: number
  total_wagered: number
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const decoded = decodeURIComponent(username)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: profileData }, { data: betsData }, { data: customBetsData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, balance, total_wagered')
      .ilike('username', decoded)
      .single(),
    supabase.rpc('get_all_bets_by_username', { p_username: decoded }),
    supabase.rpc('get_custom_bets_by_username', { p_username: decoded }),
  ])

  if (!profileData) notFound()

  const profile = profileData as ProfileRow
  const bets = (betsData ?? []) as AllBet[]
  const customBets = (customBetsData ?? []) as UserCustomBet[]

  const settled = bets.filter(b => b.settled)
  const active = bets.filter(b => !b.settled)
  const totalWon = settled.filter(b => b.won).reduce((s, b) => s + Number(b.potential_win), 0)
  const totalLost = settled.filter(b => !b.won).reduce((s, b) => s + Number(b.amount), 0)
  const net = totalWon - totalLost

  return (
    <main className="min-h-screen bg-page text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Saldo: kr {Number(profile.balance).toFixed(2)}
              </p>
            </div>
          </div>
          <Link href="/leaderboard" className="bg-detail hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-xl px-3 py-2 transition-colors">
            ← Ledertavle
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-card rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Aktive spill</p>
            <p className="text-xl font-bold text-yellow-400">{active.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Avgjorte spill</p>
            <p className="text-xl font-bold">{settled.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Total spilt</p>
            <p className="text-xl font-bold">kr {Number(profile.total_wagered).toFixed(0)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Netto</p>
            <p className={`text-xl font-bold ${net > 0 ? 'text-green-400' : net < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {net > 0 ? '+' : ''}{net.toFixed(0)}
            </p>
          </div>
        </div>

        <UserBetsView bets={bets} customBets={customBets} profileUserId={profile.id} />
      </div>
    </main>
  )
}
