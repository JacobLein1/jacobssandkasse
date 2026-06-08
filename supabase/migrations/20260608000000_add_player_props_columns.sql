-- Add player prop odds columns to the odds table
ALTER TABLE odds ADD COLUMN IF NOT EXISTS haaland_score_odds DECIMAL;
ALTER TABLE odds ADD COLUMN IF NOT EXISTS odegaard_score_odds DECIMAL;

-- Ensure RLS is enabled and anon users can read odds
ALTER TABLE odds ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'odds' AND policyname = 'Allow public read'
  ) THEN
    CREATE POLICY "Allow public read" ON odds FOR SELECT USING (true);
  END IF;
END $$;
