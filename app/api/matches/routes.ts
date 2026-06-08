// app/api/matches/route.ts
export async function GET() {
  const res = await fetch(
    'https://api.football-data.org/v4/teams/759/matches',
    { headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY! } }
  );
  const data = await res.json();
  return Response.json(data);
}