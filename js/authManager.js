/**
 * authManager.js
 * ─────────────────────────────────────────────────────────────
 * Manages virtual identity: Sign Up, Sign In, session lifecycle.
 * Stores registered accounts in localStorage (user database).
 * Active session tracked via BOTH localStorage AND a browser cookie.
 *
 * TWO STORAGE MECHANISMS demonstrated:
 *
 *  1. localStorage (riskmatrix_session)
 *     - Key/value store in the browser
 *     - Persists until explicitly removed
 *     - Only accessible via JavaScript
 *     - Not sent to servers automatically
 *
 *  2. Browser Cookie (riskmatrix_user)
 *     - Set via document.cookie
 *     - Expires after 24 hours (max-age=86400)
 *     - SameSite=Strict — only sent from same origin (security)
 *     - In a real app with a backend, the server could read this
 *     - Visible in DevTools → Application → Cookies
 *
 * Demonstrates: Virtual identity, dual session management,
 * authentication mechanisms, client-side persistence.
 * ─────────────────────────────────────────────────────────────
 */

const AuthManager = (() => {

  const ACCOUNTS_KEY  = 'riskmatrix_accounts'; // stored user registry
  const SESSION_KEY   = 'riskmatrix_session';  // localStorage session token
  const COOKIE_NAME   = 'riskmatrix_user';     // browser cookie name

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

  // ── Cookie helpers ───────────────────────────────────────────

  /**
   * Sets the session cookie ONLY if the user has given consent.
   * Consent is stored in localStorage under 'riskmatrix_cookie_consent'.
   * Value 'accepted' = allowed. 'declined' or missing = no cookie.
   *
   * SameSite=Strict prevents cross-site request forgery (CSRF).
   * path=/ makes the cookie available on all pages of the site.
   * max-age=86400 = cookie expires after 24 hours automatically.
   */
  function setCookie(username) {
    const consent = localStorage.getItem('riskmatrix_cookie_consent');
    if (consent !== 'accepted') return; // do NOT set cookie without consent
    document.cookie =
      `${COOKIE_NAME}=${encodeURIComponent(username)}` +
      `; max-age=86400`     + // 86400 seconds = 24 hours
      `; path=/`            + // valid on all pages
      `; SameSite=Strict`;    // security: only sent from same origin
  }

  /**
   * Reads the session cookie value.
   * Parses document.cookie string to find riskmatrix_user.
   * Returns username string or null if cookie not found.
   */
  function getCookie() {
    const cookies = document.cookie.split('; ');
    // document.cookie = "riskmatrix_user=Alice; other_cookie=value"
    // split by "; " gives ["riskmatrix_user=Alice", "other_cookie=value"]
    for (const c of cookies) {
      const [key, val] = c.split('=');
      if (key === COOKIE_NAME) return decodeURIComponent(val);
    }
    return null;
  }

  /**
   * Deletes the session cookie by setting max-age=0.
   * Setting max-age to 0 or negative causes immediate expiry.
   */
  function clearCookie() {
    document.cookie =
      `${COOKIE_NAME}=` +
      `; max-age=0`     + // expire immediately
      `; path=/`        +
      `; SameSite=Strict`;
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

    // Auto-login after sign up — set BOTH localStorage and cookie
    localStorage.setItem(SESSION_KEY, trimmed);
    setCookie(trimmed);
    return { success: true };
  }

  /**
   * Sign in with existing credentials.
   * Sets BOTH a localStorage session token AND a browser cookie.
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

    // Establish virtual identity via BOTH mechanisms:
    localStorage.setItem(SESSION_KEY, account.username); // mechanism 1: localStorage
    setCookie(account.username);                          // mechanism 2: browser cookie
    return { success: true };
  }

  /**
   * Returns the currently signed-in username, or null.
   * Checks localStorage first, falls back to cookie.
   * This means if localStorage is cleared manually,
   * the cookie can still restore the session.
   */
  function getUsername() {
    return localStorage.getItem(SESSION_KEY) || getCookie() || null;
  }

  /**
   * Ends the session — clears BOTH localStorage token AND cookie.
   */
  function logout() {
    localStorage.removeItem(SESSION_KEY); // clear localStorage session
    clearCookie();                         // clear browser cookie
  }

  /**
   * Returns the raw cookie string for display/demo purposes.
   * Used to show the cookie value in the browser console during viva.
   */
  function getCookieRaw() {
    return getCookie();
  }

  /**
   * Re-applies the cookie after consent is granted mid-session.
   * Called by main.js if the player accepts cookies while already logged in.
   */
  function reApplyCookie(username) {
    setCookie(username);
  }

  return { signUp, signIn, getUsername, logout, getCookieRaw, reApplyCookie };

})();