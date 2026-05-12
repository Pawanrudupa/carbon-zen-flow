-- ═══════════════════════════════════════════════════════════════════════
-- STEP 1: Clean up old tables if needed, then recreate properly
-- ═══════════════════════════════════════════════════════════════════════

-- Drop old RLS policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Anyone can view challenges" ON challenges;
DROP POLICY IF EXISTS "Users manage own challenges" ON user_challenges;
DROP POLICY IF EXISTS "Users can view challenges" ON challenges;

-- Add missing columns to challenges if they don't exist yet
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS badge_emoji text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS xp_reward int NOT NULL DEFAULT 200;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS tracking_criteria jsonb;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE challenges ALTER COLUMN description SET NOT NULL;
ALTER TABLE challenges ALTER COLUMN category SET NOT NULL;
ALTER TABLE challenges ALTER COLUMN duration_days SET NOT NULL;

-- Add progress_data column to user_challenges
ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS progress_data jsonb;

-- ═══════════════════════════════════════════════════════════════════════
-- STEP 2: Create user_stats table
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_stats (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  total_xp int DEFAULT 0,
  current_level int DEFAULT 1,
  challenges_completed int DEFAULT 0,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_entry_date date,
  achievements jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own stats" ON user_stats;
CREATE POLICY "Users view own stats" ON user_stats
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- STEP 3: RLS Policies
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Users manage own challenges" ON user_challenges FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- STEP 4: Seed 24 diverse challenges (truncate first to avoid dupes)
-- ═══════════════════════════════════════════════════════════════════════

TRUNCATE TABLE challenges RESTART IDENTITY CASCADE;

INSERT INTO challenges (title, description, category, target_co2_saving, duration_days, difficulty, xp_reward, badge_emoji, tracking_criteria, is_featured) VALUES

-- 🍽️ FOOD CHALLENGES
('Plant-Powered Week',
 'Eat 100% plant-based meals for 7 consecutive days and discover the delicious world of plant-forward eating.',
 'food', 22.00, 7, 'Medium', 300, '🌱',
 '{"type": "entry_count", "category": "food", "days": 7}'::jsonb, true),

('Meatless Monday Champion',
 'Skip meat every Monday for 4 weeks. Build a sustainable weekly habit that sticks for life.',
 'food', 15.00, 28, 'Easy', 200, '🥗',
 '{"type": "weekly_restriction", "day": "Monday", "weeks": 4}'::jsonb, false),

('Local Food Hero',
 'Source only local, seasonal produce for 2 weeks. Support your community and slash food miles.',
 'food', 12.00, 14, 'Medium', 250, '🌾',
 '{"type": "entry_count", "category": "food", "min_count": 14}'::jsonb, false),

('Zero Food Waste',
 'Log every meal and generate zero food waste for 1 week. Plan smart, eat everything.',
 'food', 8.00, 7, 'Hard', 350, '♻️',
 '{"type": "perfect_tracking", "category": "food", "days": 7}'::jsonb, false),

('Meal Prep Master',
 'Batch-cook on Sundays for 3 weeks. Reduce cooking emissions by 40% while eating better.',
 'food', 18.00, 21, 'Medium', 280, '🍲',
 '{"type": "co2_reduction", "category": "food", "reduction_pct": 40, "duration": 21}'::jsonb, true),

-- 🚗 TRANSPORT CHALLENGES
('Car-Free Week',
 'Zero car trips for 7 days — walk, bike, or take transit only. Feel the city in a new way.',
 'transport', 45.00, 7, 'Hard', 400, '🚲',
 '{"type": "no_subcategory", "category": "transport", "avoid": "car", "days": 7}'::jsonb, true),

('Bike Commute Streak',
 'Bike to work or school for 10 consecutive days. Build muscle, save carbon, love mornings.',
 'transport', 35.00, 10, 'Medium', 320, '🚴',
 '{"type": "streak", "category": "transport", "subcategory": "bike", "days": 10}'::jsonb, false),

('Public Transit Convert',
 'Use only public transport for 2 full weeks. Read books, meet people, skip traffic.',
 'transport', 28.00, 14, 'Easy', 240, '🚇',
 '{"type": "only_subcategory", "category": "transport", "subcategory": "transit", "days": 14}'::jsonb, false),

('Walking Warrior',
 'Walk as your primary transport for 14 days. Every step saves carbon and boosts your health.',
 'transport', 20.00, 14, 'Easy', 220, '🚶',
 '{"type": "daily_minimum", "metric": "steps", "min_value": 10000, "days": 14}'::jsonb, false),

('No-Fly Month',
 'Avoid all air travel for 30 days. Discover the joy of slow travel and local adventures.',
 'transport', 180.00, 30, 'Hard', 500, '✈️',
 '{"type": "no_subcategory", "category": "transport", "avoid": "flight", "days": 30}'::jsonb, true),

-- ⚡ ENERGY CHALLENGES
('Lights Out at 9',
 'Turn off all non-essential lights by 9 PM for 10 days. Embrace the calm of candlelit evenings.',
 'energy', 5.00, 10, 'Easy', 180, '💡',
 '{"type": "daily_habit", "action": "lights_out", "time": "21:00", "days": 10}'::jsonb, false),

('Vampire Power Slayer',
 'Unplug all standby devices for 2 weeks. Kill the invisible energy drain robbing you silently.',
 'energy', 12.00, 14, 'Medium', 260, '🔌',
 '{"type": "co2_reduction", "category": "energy", "subcategory": "standby", "reduction_pct": 80}'::jsonb, true),

('Cold Shower Challenge',
 'Take cold showers only for 7 days. Boost circulation, save water heating, feel alive.',
 'energy', 8.00, 7, 'Hard', 350, '🚿',
 '{"type": "behavioral", "action": "cold_shower", "days": 7}'::jsonb, false),

('AC-Free Week',
 'No air conditioning for 7 days. Open windows, use fans, and reconnect with natural airflow.',
 'energy', 25.00, 7, 'Hard', 380, '🌬️',
 '{"type": "no_appliance", "appliance": "ac", "days": 7}'::jsonb, false),

('Energy Audit Pro',
 'Track every electricity usage for 14 days and identify where you can cut 20%. Knowledge is power.',
 'energy', 18.00, 14, 'Medium', 290, '📊',
 '{"type": "co2_reduction", "category": "energy", "reduction_pct": 20, "tracking_required": true}'::jsonb, true),

-- 🛍️ SHOPPING CHALLENGES
('Buy Nothing Week',
 'Zero non-essential purchases for 7 days. Break the consumption cycle and find true needs.',
 'shopping', 30.00, 7, 'Medium', 280, '🚫',
 '{"type": "no_entries", "category": "shopping", "days": 7}'::jsonb, true),

('Second-Hand Hero',
 'Buy only used or second-hand items for 1 month. Give products a second life, not a landfill.',
 'shopping', 50.00, 30, 'Hard', 420, '🪙',
 '{"type": "entry_restriction", "category": "shopping", "tag_required": "second-hand", "days": 30}'::jsonb, false),

('Minimalist Month',
 'Keep your shopping footprint under 10 kg CO₂ for 30 days. Less is genuinely more.',
 'shopping', 40.00, 30, 'Medium', 320, '✨',
 '{"type": "monthly_cap", "category": "shopping", "max_co2": 10}'::jsonb, false),

('Package-Free Shopping',
 'Shop with reusable bags and containers for 2 weeks. Refuse single-use plastic at every turn.',
 'shopping', 8.00, 14, 'Easy', 200, '🎒',
 '{"type": "behavioral", "action": "zero_packaging", "days": 14}'::jsonb, false),

-- 🌱 LIFESTYLE CHALLENGES
('Zero Waste Week',
 'Produce zero landfill waste for 7 days — compost organics, recycle everything else.',
 'lifestyle', 12.00, 7, 'Hard', 400, '🌍',
 '{"type": "behavioral", "action": "zero_waste", "days": 7}'::jsonb, true),

('Plastic-Free Fortnight',
 'Avoid all single-use plastic for 14 days. Protect oceans, wildlife, and your own body.',
 'lifestyle', 15.00, 14, 'Medium', 300, '🌊',
 '{"type": "behavioral", "action": "no_plastic", "days": 14}'::jsonb, false),

('Digital Detox Weekend',
 'Minimize device usage 2 weekends in a row. Reduce digital carbon and rediscover offline life.',
 'lifestyle', 3.00, 14, 'Easy', 180, '📵',
 '{"type": "weekend_behavior", "action": "digital_detox", "weekends": 2}'::jsonb, false),

('Community Climate Action',
 'Organize or join 3 local climate events in 1 month. Change starts with your neighborhood.',
 'lifestyle', 0.00, 30, 'Hard', 500, '🤝',
 '{"type": "event_participation", "events": 3, "duration": 30}'::jsonb, true),

('Carbon Education Sprint',
 'Read 5 climate articles and log your key learnings this month. Know the enemy, fight smarter.',
 'lifestyle', 0.00, 30, 'Easy', 220, '📚',
 '{"type": "entry_count", "tag_required": "learned", "min_count": 5, "duration": 30}'::jsonb, false);

-- ═══════════════════════════════════════════════════════════════════════
-- STEP 5: Progress calculation function
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_challenge_progress(
  p_user_id uuid,
  p_challenge_id uuid
) RETURNS decimal AS $$
DECLARE
  v_challenge record;
  v_user_challenge record;
  v_progress decimal := 0;
  v_criteria jsonb;
  v_days_elapsed int;
  v_required_days int;
  v_entry_count int;
BEGIN
  SELECT * INTO v_challenge FROM challenges WHERE id = p_challenge_id;
  SELECT * INTO v_user_challenge FROM user_challenges
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  v_criteria := v_challenge.tracking_criteria;
  v_days_elapsed := GREATEST(0, EXTRACT(DAY FROM now() - v_user_challenge.started_at)::int);
  v_required_days := v_challenge.duration_days;

  CASE v_criteria->>'type'
    WHEN 'entry_count' THEN
      SELECT COUNT(*) INTO v_entry_count
      FROM entries
      WHERE user_id = p_user_id
        AND logged_at >= v_user_challenge.started_at
        AND (v_criteria->>'category' IS NULL OR category = v_criteria->>'category');
      v_progress := LEAST(100, v_entry_count * 100.0 / GREATEST(1, (v_criteria->>'min_count')::int));

    WHEN 'no_entries' THEN
      v_progress := LEAST(100, v_days_elapsed * 100.0 / v_required_days);

    WHEN 'co2_reduction' THEN
      v_progress := LEAST(100, v_days_elapsed * 100.0 / v_required_days);

    WHEN 'streak' THEN
      v_progress := LEAST(100, v_days_elapsed * 100.0 / v_required_days);

    ELSE
      v_progress := LEAST(100, v_days_elapsed * 100.0 / v_required_days);
  END CASE;

  RETURN LEAST(100, GREATEST(0, v_progress));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════
-- STEP 6: Auto-award XP when completing a challenge
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION award_challenge_xp()
RETURNS trigger AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    -- Upsert user stats
    INSERT INTO user_stats (user_id, total_xp, challenges_completed, updated_at)
    VALUES (NEW.user_id, COALESCE(NEW.xp_earned, 0), 1, now())
    ON CONFLICT (user_id) DO UPDATE
      SET total_xp = user_stats.total_xp + COALESCE(NEW.xp_earned, 0),
          challenges_completed = user_stats.challenges_completed + 1,
          current_level = (user_stats.total_xp + COALESCE(NEW.xp_earned, 0)) / 1000 + 1,
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_challenge_completed ON user_challenges;
CREATE TRIGGER on_challenge_completed
  AFTER UPDATE ON user_challenges
  FOR EACH ROW EXECUTE FUNCTION award_challenge_xp();
