-- Migration: Expand match types to gender-specific categories
-- From: singles, doubles, mixed_doubles
-- To: MS (Men's Singles), WS (Women's Singles), XD (Mixed Doubles), MD (Men's Doubles), WD (Women's Doubles)

-- Step 1: Create new enum type
CREATE TYPE match_type_new AS ENUM ('MS', 'WS', 'XD', 'MD', 'WD');

-- Step 2: Update sessions table
ALTER TABLE sessions
  ALTER COLUMN match_type_default DROP DEFAULT,
  ALTER COLUMN match_type_default TYPE match_type_new
    USING CASE match_type_default::text
      WHEN 'singles' THEN 'MS'::match_type_new
      WHEN 'doubles' THEN 'MD'::match_type_new
      WHEN 'mixed_doubles' THEN 'XD'::match_type_new
      ELSE NULL
    END,
  ALTER COLUMN match_type_default SET DEFAULT NULL;

-- Step 3: Update matches table
ALTER TABLE matches
  ALTER COLUMN match_type TYPE match_type_new
    USING CASE match_type::text
      WHEN 'singles' THEN 'MS'::match_type_new
      WHEN 'doubles' THEN 'MD'::match_type_new
      WHEN 'mixed_doubles' THEN 'XD'::match_type_new
      ELSE 'MD'::match_type_new
    END;

-- Step 4: Drop old enum type
DROP TYPE match_type;

-- Step 5: Rename new enum type to match_type
ALTER TYPE match_type_new RENAME TO match_type;

-- Add comments for documentation
COMMENT ON TYPE match_type IS 'Match types: MS (Men Singles), WS (Women Singles), XD (Mixed Doubles), MD (Men Doubles), WD (Women Doubles)';
