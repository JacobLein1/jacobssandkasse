import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

interface MatchOdds {
  id: number
  match_id: string
  home_team: string
  away_team: string
  match_date: string
  home_odds: number | null
  draw_odds: number | null
  away_odds: number | null
  bookmaker: string | null
  haaland_score_odds: number | null
  odegaard_score_odds: number | null
  updated_at: string
}

const FLAGS: Record<string, string> = {
  Norway: '🇳🇴',
  Argentina: '🇦🇷',
  Brazil: '🇧🇷',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Spain: '🇪🇸',
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  Portugal: '🇵🇹',
  Netherlands: '🇳🇱',
  Belgium: '🇧🇪',
  Italy: '🇮🇹',
  Croatia: '🇭🇷',
  Denmark: '🇩🇰',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Poland: '🇵🇱',
  'United States': '🇺🇸',
  Mexico: '🇲🇽',
  Canada: '🇨🇦',
  Japan: '🇯🇵',
  'South Korea': '🇰🇷',
  Australia: '🇦🇺',
  Morocco: '🇲🇦',
  Senegal: '🇸🇳',
  Uruguay: '🇺🇾',
  Colombia: '🇨🇴',
  Ecuador: '🇪🇨',
  Chile: '🇨🇱',
  Peru: '🇵🇪',
  Serbia: '🇷🇸',
  Ukraine: '🇺🇦',
  Austria: '🇦🇹',
  Turkey: '🇹🇷',
  'Saudi Arabia': '🇸🇦',
  Ghana: '🇬🇭',
  Cameroon: '🇨🇲',
  Nigeria: '🇳🇬',
  'Ivory Coast': '🇨🇮',
  'Costa Rica': '🇨🇷',
  Panama: '🇵🇦',
  Qatar: '🇶🇦',
  Iran: '🇮🇷',
  'Czech Republic': '🇨🇿',
  Hungary: '🇭🇺',
  Romania: '🇷🇴',
  Algeria: '🇩🇿',
  Tunisia: '🇹🇳',
  Egypt: '🇪🇬',
  'South Africa': '🇿🇦',
  Jamaica: '🇯🇲',
  Venezuela: '🇻🇪',
  Bolivia: '🇧🇴',
  Paraguay: '🇵🇾',
}

function flag(team: string): string {
  return FLAGS[team] ?? '🏳️'
}

function fmt(odds: number | null): string {
  return odds != null ? odds.toFixed(2) : '—'
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nb-NO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Oslo',
  })
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('nb-NO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Oslo',
  })
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (mins < 1) return 'nettopp'
  if (mins < 60) return `${mins} min siden`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h} t siden`
  return `${Math.floor(h / 24)} d siden`
}

async function getNorwayMatches(): Promise<MatchOdds[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data, error } = await supabase
    .from('odds')
    .select('*')
    .or('home_team.eq.Norway,away_team.eq.Norway')
    .order('match_date', { ascending: true })
    .limit(3)
  if (error) throw error
  return data ?? []
}

function OddsCell({
  label,
  value,
  highlight,
}: {
  label: string
  value: number | null
  highlight?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl px-3 py-3 gap-1 ${highlight ? 'bg-red-700' : 'bg-gray-800'
        }`}
    >
      <span className="text-xs text-gray-400 truncate max-w-full text-center leading-tight">
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums">{fmt(value)}</span>
    </div>
  )
}

function MatchCard({ match }: { match: MatchOdds }) {
  const hasProps =
    match.haaland_score_odds != null || match.odegaard_score_odds != null

  return (
    <article className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4 shadow-lg">
      {/* Date / time */}
      <p className="text-gray-400 text-sm mb-5 capitalize">
        {fmtDate(match.match_date)}&nbsp;&middot;&nbsp;{fmtTime(match.match_date)}
      </p>

      {/* Teams */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col items-center gap-1 w-5/12">
          <span className="text-5xl leading-none">{flag(match.home_team)}</span>
          <span className="text-sm font-semibold text-center mt-1">
            {match.home_team}
          </span>
        </div>
        <span className="text-gray-600 text-sm font-medium">vs</span>
        <div className="flex flex-col items-center gap-1 w-5/12">
          <span className="text-5xl leading-none">{flag(match.away_team)}</span>
          <span className="text-sm font-semibold text-center mt-1">
            {match.away_team}
          </span>
        </div>
      </div>

      {/* H2H odds */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <OddsCell
          label={match.home_team}
          value={match.home_odds}
          highlight={match.home_team === 'Norway'}
        />
        <OddsCell label="Uavgjort" value={match.draw_odds} />
        <OddsCell
          label={match.away_team}
          value={match.away_odds}
          highlight={match.away_team === 'Norway'}
        />
      </div>

      {/* Player props */}
      {hasProps && (
        <div className="border-t border-gray-800 pt-4 mt-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Mål-odds (når som helst)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {match.haaland_score_odds != null && (
              <div className="bg-gray-800 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">⚽ E. Haaland</p>
                <p className="text-xl font-bold tabular-nums">
                  {fmt(match.haaland_score_odds)}
                </p>
              </div>
            )}
            {match.odegaard_score_odds != null && (
              <div className="bg-gray-800 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-1">⚽ M. Ødegaard</p>
                <p className="text-xl font-bold tabular-nums">
                  {fmt(match.odegaard_score_odds)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex justify-between text-xs text-gray-600">
        {match.bookmaker ? <span>via {match.bookmaker}</span> : <span />}
        <span>Oppdatert {timeAgo(match.updated_at)}</span>
      </div>
    </article>
  )
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
    getNorwayMatches().then(m => ({ matches: m, error: null })).catch(() => ({ matches: [] as MatchOdds[], error: 'Kunne ikke laste odds.' })),
  ])

  const { matches, error: fetchError } = matchResult

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-10">

        {/* User bar */}
        <div className="flex items-center justify-between mb-8 min-h-[2.5rem]">
          {user && profile ? (
            <>
              <div className="flex items-center gap-3">
                <div>
                  <span className="font-semibold text-sm">{profile.username}</span>
                  <span className="text-gray-400 text-sm"> · kr {Number(profile.balance).toFixed(2)}</span>
                </div>
                {profile.is_admin && (
                  <Link
                    href="/admin"
                    className="text-xs bg-red-700/40 text-red-300 rounded px-2 py-1 hover:bg-red-700/60 transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/leaderboard"
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  🏆 Ledertavle
                </Link>
                <form action={logout}>
                  <button type="submit" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Logg ut
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex gap-3 ml-auto">
              <Link href="/leaderboard" className="text-gray-400 hover:text-white text-sm transition-colors">
                🏆 Ledertavle
              </Link>
              <Link href="/login" className="text-gray-300 hover:text-white text-sm transition-colors">
                Logg inn
              </Link>
              <Link
                href="/register"
                className="bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg px-3 py-1.5 transition-colors"
              >
                Registrer deg
              </Link>
            </div>
          )}
        </div>

        {/* Page title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🇳🇴</div>
          <h1 className="text-2xl font-bold tracking-tight">Norge i VM 2026</h1>
          <p className="text-gray-400 text-sm mt-1">
            Gruppespill · FIFA World Cup 2026
          </p>
        </div>

        {fetchError && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-4 text-center text-sm mb-6">
            {fetchError}
          </div>
        )}

        {!fetchError && matches.length === 0 && (
          <p className="text-center text-gray-500 py-16 text-sm">
            Ingen kamper funnet ennå. Odds publiseres nærmere kampstart.
          </p>
        )}

        {matches.map(match => (
          <MatchCard key={match.match_id} match={match} />
        ))}
      </div>
    </main>
  )
}
