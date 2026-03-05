/**
 * authManager.js
 * ─────────────────────────────────────────────────────────────
 * Manages virtual identity: Sign Up, Sign In, session lifecycle.
 * Stores registered accounts in localStorage (user database).
 * Active session tracked separately as a session token.
 *
 * Demonstrates: Virtual identity, authentication, client-side
 * persistence — analogous to cookie-based session management.
 * ─────────────────────────────────────────────────────────────
 */

const AuthManager = (() => {

  const ACCOUNTS_KEY = 'riskmatrix_accounts'; // stored user registry
  const SESSION_KEY  = 'riskmatrix_session';  // active session token

  // ── Private helpers ──────────────────────────────────────────

  function getAccounts() {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  function hashPassword(password) {
    // Simple deterministic hash (not cryptographic — for demo purposes)
    // In a real system, use bcrypt server-side.
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (Math.imul(31, hash) + password.charCodeAt(i)) | 0;
    }
    return hash.toString(16);
  }

  function validate(username, password) {
    if (!username || username.trim().length < 2)
      return 'Username must be at least 2 characters.';
    if (username.trim().length > 20)
      return 'Username too long (max 20 chars).';
    if (!password || password.length < 4)
      return 'Password must be at least 4 characters.';
    return null;
  }

  // ── Public API ───────────────────────────────────────────────

  /**
   * Register a new account.
   * Returns { success: boolean, error?: string }
   */
  function signUp(username, password) {
    const err = validate(username, password);
    if (err) return { success: false, error: err };

    const trimmed  = username.trim();
    const accounts = getAccounts();

    if (accounts[trimmed.toLowerCase()]) {
      return { success: false, error: 'Username already taken. Try signing in.' };
    }

    accounts[trimmed.toLowerCase()] = {
      username: trimmed,
      passwordHash: hashPassword(password),
      createdAt: Date.now()
    };
    saveAccounts(accounts);

    // Auto-login after sign up
    localStorage.setItem(SESSION_KEY, trimmed);
    return { success: true };
  }

  /**
   * Sign in with existing credentials.
   * Returns { success: boolean, error?: string }
   */
  function signIn(username, password) {
    const err = validate(username, password);
    if (err) return { success: false, error: err };

    const trimmed  = username.trim();
    const accounts = getAccounts();
    const account  = accounts[trimmed.toLowerCase()];

    if (!account) {
      return { success: false, error: 'No account found. Please sign up first.' };
    }
    if (account.passwordHash !== hashPassword(password)) {
      return { success: false, error: 'Incorrect password. Try again.' };
    }

    localStorage.setItem(SESSION_KEY, account.username);
    return { success: true };
  }

  /**
   * Returns the currently signed-in username, or null.
   */
  function getUsername() {
    return localStorage.getItem(SESSION_KEY);
  }

  /**
   * Ends the session (logout).
   */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  return { signUp, signIn, getUsername, logout };

})();