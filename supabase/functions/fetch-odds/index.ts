import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'
const SPORT = 'soccer_fifa_world_cup'

interface OddsOutcome {
  name: string
  price: number
  point?: number
}

interface OddsMarket {
  key: string
  outcomes: OddsOutcome[]
}

interface OddsBookmaker {
  key: string
  title: string
  markets: OddsMarket[]
}

interface OddsGame {
  id: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: OddsBookmaker[]
}

type TotalsMap = Record<string, { over?: number; under?: number }>

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const apiKey = Deno.env.get('ODDS_API_KEY')!

  const res = await fetch(
    `${ODDS_API_BASE}/sports/${SPORT}/odds?regions=eu&markets=h2h,totals&oddsFormat=decimal&apiKey=${apiKey}`
  )

  if (!res.ok) {
    const text = await res.text()
    return new Response(
      JSON.stringify({ error: `Odds API error ${res.status}`, detail: text }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const games: OddsGame[] = await res.json()

  if (!Array.isArray(games)) {
    return new Response(
      JSON.stringify({ error: 'Unexpected response shape', data: games }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }

  console.log(`Fetched ${games.length} games`)

  const now = new Date().toISOString()
  const records = []

  for (const game of games) {
    console.log(`\n=== ${game.home_team} vs ${game.away_team} ===`)
    console.log(`  Bookmakers (${game.bookmakers?.length ?? 0}):`)

    for (const b of game.bookmakers ?? []) {
      const keys = b.markets.map(m => m.key).join(', ')
      console.log(`    [${b.title}] markets: ${keys}`)
    }

    // H2H: first bookmaker that has h2h market
    const h2hBookmaker = game.bookmakers?.find(b => b.markets.some(m => m.key === 'h2h'))
    const h2hOutcomes = h2hBookmaker?.markets.find(m => m.key === 'h2h')?.outcomes ?? []

    // Totals: first bookmaker that has totals market (no fallback to avoid wrong bookmaker)
    const totalsBookmaker = game.bookmakers?.find(b => b.markets.some(m => m.key === 'totals'))
    console.log(`  Has totals bookmaker: ${totalsBookmaker ? totalsBookmaker.title : 'NONE'}`)

    const totalsOutcomes = totalsBookmaker?.markets.find(m => m.key === 'totals')?.outcomes ?? []
    console.log(`  Raw totals outcomes (${totalsOutcomes.length}): ${JSON.stringify(totalsOutcomes)}`)

    // Build JSONB map keyed by line (e.g. "2.5")
    let totalsMap: TotalsMap | null = null
    if (totalsOutcomes.length > 0) {
      totalsMap = {}
      for (const o of totalsOutcomes) {
        if (o.point == null) continue
        const key = String(o.point)
        if (!totalsMap[key]) totalsMap[key] = {}
        totalsMap[key][o.name.toLowerCase() as 'over' | 'under'] = o.price
      }
      if (Object.keys(totalsMap).length === 0) totalsMap = null
    }
    console.log(`  Constructed totals: ${JSON.stringify(totalsMap)}`)

    records.push({
      match_id: game.id,
      home_team: game.home_team,
      away_team: game.away_team,
      match_date: game.commence_time,
      home_odds: h2hOutcomes.find(o => o.name === game.home_team)?.price ?? null,
      draw_odds: h2hOutcomes.find(o => o.name === 'Draw')?.price ?? null,
      away_odds: h2hOutcomes.find(o => o.name === game.away_team)?.price ?? null,
      bookmaker: h2hBookmaker?.title ?? null,
      totals: totalsMap,
      updated_at: now,
    })
  }

  console.log(`\nUpserting ${records.length} records...`)

  const { error } = await supabase
    .from('odds')
    .upsert(records, { onConflict: 'match_id' })

  if (error) {
    console.error('Upsert error:', error.message, error)
    return new Response(JSON.stringify({ error: error.message, details: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const norwayCount = records.filter(
    r => r.home_team === 'Norway' || r.away_team === 'Norway'
  ).length
  const withTotals = records.filter(r => r.totals !== null).length

  console.log(`Done. Norway games: ${norwayCount}, games with totals: ${withTotals}`)

  return new Response(
    JSON.stringify({
      success: true,
      total: records.length,
      norway: norwayCount,
      withTotals,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
