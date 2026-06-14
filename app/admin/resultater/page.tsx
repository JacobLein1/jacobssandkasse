import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { flag } from '@/lib/flags'
import { ResultsEditor } from './ResultsEditor'
import { Logo } from '@/components/Logo'

interface Match {
  match_id: string
  home_team: string
  away_team: string
  match_date: string
  settled: boolean
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Oslo',
  })
}

export default async function ResultaterPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: caller } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!caller?.is_admin) redirect('/')

  const { data, error: matchesError } = await supabase
    .from('odds')
    .select('match_id, home_team, away_team, match_date, settled')
    .order('match_date', { ascending: true })

  const matches = (data ?? []) as Match[]

  return (
    <main className="min-h-screen bg-page text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">Resultater</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Lagre kampresultat og avgjør spill automatisk
              </p>
            </div>
          </div>
          <Link href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Admin
          </Link>
        </div>

        {matchesError && (
          <div className="bg-red-950 border border-red-800 text-red-300 rounded-xl p-4 text-sm mb-6">
            Databasefeil: {matchesError.message}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Kamp</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium hidden sm:table-cell">Dato</th>
                <th className="text-left px-5 py-3 text-gray-400 font-medium">Resultat</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, i) => (
                <tr
                  key={m.match_id}
                  className={`border-b border-gray-800 last:border-0 ${i % 2 !== 0 ? 'bg-gray-900/50' : ''}`}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">
                      {flag(m.home_team)} {m.home_team}
                    </p>
                    <p className="text-gray-400">
                      {flag(m.away_team)} {m.away_team}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-gray-400 hidden sm:table-cell">
                    {fmtDate(m.match_date)}
                  </td>
                  <td className="px-5 py-4">
                    {m.settled ? (
                      <span className="text-xs font-semibold bg-green-900/40 text-green-400 rounded-full px-3 py-1">
                        ✓ Avgjort
                      </span>
                    ) : (
                      <ResultsEditor matchId={m.match_id} />
                    )}
                  </td>
                </tr>
              ))}
              {matches.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-500">
                    Ingen kamper funnet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-gray-600 text-xs mt-4 text-center">
          Lagring avgjør alle ventende spill for den kampen og utbetaler gevinster.
        </p>
      </div>
    </main>
  )
}
