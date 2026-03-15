/**
 * leaderboard.js
 * ─────────────────────────────────────────────────────────────
 * Manages the global leaderboard using Supabase (PostgreSQL).
 *
 * High Cohesion : one job — save scores and fetch top 10.
 * Low Coupling  : receives plain data, returns plain data.
 *                 No knowledge of GameState, UI, or auth.
 *
 * Storage architecture:
 *   PRIMARY   → Supabase PostgreSQL (shared across all players)
 *   FALLBACK  → localStorage (if Supabase is unreachable)
 *
 * ─── HOW TO CONNECT YOUR SUPABASE PROJECT ────────────────────
 * 1. Go to supabase.com → sign up free → New Project
 * 2. Dashboard → Settings → API
 * 3. Copy: Project URL  →  phttps://vmoaskubzlcwymwedvvs.supabase.co
 *          anon public  →  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb2Fza3Viemxjd3ltd2VkdnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODUzODYsImV4cCI6MjA4OTE2MTM4Nn0.UfESwFiSu7hiIh0iNHx5Iuz54gJDzxpvWj9yNhhvzv8
 * 4. SQL Editor → run the CREATE TABLE command in SETUP.md
 * 5. Push to GitHub → Vercel redeploys automatically
 * ─────────────────────────────────────────────────────────────
 */

const LeaderBoard = (() => {

  // ── STEP 1:  My Supabase credentials here ─────────
  const SUPABASE_URL = 'https://vmoaskubzlcwymwedvvs.supabase.co';        // https://xxxx.supabase.co
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb2Fza3Viemxjd3ltd2VkdnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODUzODYsImV4cCI6MjA4OTE2MTM4Nn0.UfESwFiSu7hiIh0iNHx5Iuz54gJDzxpvWj9yNhhvzv8';   // eyJhbGci...

  // ── localStorage fallback key ─────────────────────────────
  const LOCAL_KEY = 'riskmatrix_local_scores';

  // ── Supabase client — created once, reused ────────────────
  let _client = null;

  function _getClient() {
    if (!_client) {
      _client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return _client;
  }

  // ── saveScore() ───────────────────────────────────────────
  // Called from main.js endGame() when the game ends.
  // Primary: saves to Supabase PostgreSQL
  // Fallback: saves to localStorage if Supabase unreachable
  async function saveScore(username, score, profile) {
    try {
      const { error } = await _getClient()
        .from('leaderboard')
        .insert({ username, score, profile });

      if (error) throw error;
      console.log('[LeaderBoard] Score saved to Supabase');

    } catch (err) {
      console.warn('[LeaderBoard] Supabase unreachable — saving locally:', err.message);
      const existing = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      existing.push({
        username,
        score,
        profile,
        played_at : new Date().toISOString(),
        source    : 'local'
      });
      localStorage.setItem(LOCAL_KEY, JSON.stringify(existing));
    }
  }

  // ── getTopScores() ────────────────────────────────────────
  // Returns top 10 scores sorted by score descending.
  // Fallback: returns localStorage scores if Supabase unreachable
  async function getTopScores() {
    try {
      const { data, error } = await _getClient()
        .from('leaderboard')
        .select('username, score, profile, played_at')
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];

    } catch (err) {
      console.warn('[LeaderBoard] Using local scores:', err.message);
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      return local.sort((a, b) => b.score - a.score).slice(0, 10);
    }
  }

  return { saveScore, getTopScores };

})();