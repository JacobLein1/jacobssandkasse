import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { NewBetForm } from './NewBetForm'

export default async function NewBetPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: matches } = await supabase
    .from('odds')
    .select('match_id, home_team, away_team, match_date')
    .gt('match_date', new Date().toISOString())
    .order('match_date', { ascending: true })

  return (
    <main className="min-h-screen bg-page text-white">
      <div className="max-w-lg mx-auto px-4 py-10">

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="text-2xl font-bold">Nytt bet</h1>
              <p className="text-gray-400 text-sm mt-0.5">Utfordre en annen bruker</p>
            </div>
          </div>
          <Link href="/bets" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Tilbake
          </Link>
        </div>

        <div className="bg-card border border-gray-800 rounded-2xl p-6">
          <NewBetForm matches={matches ?? []} />
        </div>
      </div>
    </main>
  )
}
