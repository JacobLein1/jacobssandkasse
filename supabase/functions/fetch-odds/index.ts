import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4'
const SPORT = 'soccer_fifa_world_cup'

interface OddsOutcome {
  name: string
  price: number
  description?: string
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

function findPlayerOdds(bookmakers: OddsBookmaker[], nameFragment: string): number | null {
  for (const bookmaker of bookmakers) {
    const market = bookmaker.markets.find(m => m.key === 'player_to_score_anytime')
    if (!market) continue
    const outcome = market.outcomes.find(o =>
      o.name.toLowerCase().includes(nameFragment.toLowerCase())
    )
    if (outcome) return outcome.price
  }
  return null
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  ) 

  const apiKey = Deno.env.get('ODDS_API_KEY')!

  const h2hRes = await fetch(
    `${ODDS_API_BASE}/sports/${SPORT}/odds?regions=eu&markets=h2h&oddsFormat=decimal&apiKey=${apiKey}`
  )

  if (!h2hRes.ok) {
    const text = await h2hRes.text()
    return new Response(
      JSON.stringify({ error: `Odds API error ${h2hRes.status}`, detail: text }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const games: OddsGame[] = await h2hRes.json()

  if (!Array.isArray(games)) {
    return new Response(
      JSON.stringify({ error: 'Unexpected response shape', data: games }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const records = []
  const now = new Date().toISOString()

  for (const game of games) {
    const isNorwayGame =
      game.home_team === 'Norway' || game.away_team === 'Norway'

    // Prefer a bookmaker that has h2h market; fall back to first available
    const bookmaker =
      game.bookmakers?.find(b => b.markets.some(m => m.key === 'h2h')) ??
      game.bookmakers?.[0]

    const h2hMarket = bookmaker?.markets?.find(m => m.key === 'h2h')
    const outcomes = h2hMarket?.outcomes ?? []

    let haalandOdds: number | null = null
    let odegaardOdds: number | null = null

    if (isNorwayGame) {
      try {
        const propsRes = await fetch(
          `${ODDS_API_BASE}/sports/${SPORT}/events/${game.id}/odds?regions=eu&markets=player_to_score_anytime&oddsFormat=decimal&apiKey=${apiKey}`
        )
        if (propsRes.ok) {
          const propsData = await propsRes.json()
          if (propsData.bookmakers) {
            haalandOdds = findPlayerOdds(propsData.bookmakers, 'haaland')
            odegaardOdds =
              findPlayerOdds(propsData.bookmakers, 'odegaard') ??
              findPlayerOdds(propsData.bookmakers, 'ødegaard')
          }
        }
      } catch {
        // Player props unavailable — not critical, continue
      }
    }

    records.push({
      match_id: game.id,
      home_team: game.home_team,
      away_team: game.away_team,
      match_date: game.commence_time,
      home_odds:
        outcomes.find((o: OddsOutcome) => o.name === game.home_team)?.price ??
        null,
      draw_odds:
        outcomes.find((o: OddsOutcome) => o.name === 'Draw')?.price ?? null,
      away_odds:
        outcomes.find((o: OddsOutcome) => o.name === game.away_team)?.price ??
        null,
      bookmaker: bookmaker?.title ?? null,
      haaland_score_odds: haalandOdds,
      odegaard_score_odds: odegaardOdds,
      updated_at: now,
    })
  }

  const { error } = await supabase
    .from('odds')
    .upsert(records, { onConflict: 'match_id' })

  if (error) {
    return new Response(JSON.stringify({ error: error.message, details: error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const norwayCount = records.filter(
    r => r.home_team === 'Norway' || r.away_team === 'Norway'
  ).length

  return new Response(
    JSON.stringify({ success: true, total: records.length, norway: norwayCount }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
