/**
 * main.js
 * ─────────────────────────────────────────────────────────────
 * Game Orchestrator — entry point of RiskMatrix.
 * Manages: Sign Up screen → Sign In screen → Game → Final screen.
 * Logout is available at any point during gameplay.
 *
 * Demonstrates event-driven programming, low coupling, separation
 * of concerns — this file only orchestrates, never computes.
 * ─────────────────────────────────────────────────────────────
 */

// ── Game State ─────────────────────────────────────────────────
const GameState = {
  username:      '',
  score:         0,
  round:         1,
  cluesUsed:     0,
  correctCount:  0,
  wrongCount:    0,
  totalRounds:   5,
  clueHintText:  null,
  riskPuzzle:    null,
  eventsWired:   false
};

// ── Bootstrap ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  wireAuthEvents();
  wireLogoutEvents();
  wireCookieConsent();   // show banner if consent not yet decided

  // If already signed in (persistent session), go straight to game
  const existing = AuthManager.getUsername();
  if (existing) {
    GameState.username = existing;
    startGame();
  }
});

// ═══════════════════════════════════════════════════════════════
// AUTH — SIGN UP SCREEN
// ═══════════════════════════════════════════════════════════════

function wireAuthEvents() {
  // Navigation between screens
  document.getElementById('link-to-signin').addEventListener('click', () => goToSignIn());
  document.getElementById('link-to-signup').addEventListener('click', () => goToSignUp());

  // Sign Up
  document.getElementById('btn-signup').addEventListener('click', handleSignUp);
  document.getElementById('signup-password2').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSignUp();
  });

  // Sign In
  document.getElementById('btn-signin').addEventListener('click', handleSignIn);
  document.getElementById('signin-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSignIn();
  });
}

function goToSignUp(message) {
  clearAuthErrors();
  UiController.showScreen('screen-signup');
  if (message) {
    const el = document.getElementById('signup-success');
    el.textContent = message;
    el.classList.remove('hidden');
  }
}

function goToSignIn(noticeMessage) {
  clearAuthErrors();
  UiController.showScreen('screen-signin');
  const notice = document.getElementById('signin-notice');
  if (noticeMessage) {
    notice.textContent = noticeMessage;
    notice.classList.remove('hidden');
  } else {
    notice.classList.add('hidden');
  }
}

function clearAuthErrors() {
  ['signup-error','signup-success','signin-error','signin-notice'].forEach(id => {
    const el = document.getElementById(id);
    el.textContent = '';
    el.classList.add('hidden');
  });
}

function handleSignUp() {
  const username  = document.getElementById('signup-username').value.trim();
  const password  = document.getElementById('signup-password').value;
  const password2 = document.getElementById('signup-password2').value;
  const errEl     = document.getElementById('signup-error');
  const okEl      = document.getElementById('signup-success');

  errEl.classList.add('hidden');
  okEl.classList.add('hidden');

  // Client-side check: passwords match
  if (password !== password2) {
    errEl.textContent = '⚠ Passwords do not match.';
    errEl.classList.remove('hidden');
    return;
  }

  const result = AuthManager.signUp(username, password);

  if (!result.success) {
    errEl.textContent = '⚠ ' + result.error;
    errEl.classList.remove('hidden');
    return;
  }

  // Registration success — show message then redirect to Sign In
  okEl.textContent = `✓ Account "${username}" created! Redirecting to Sign In…`;
  okEl.classList.remove('hidden');

  // Clear sign up fields
  document.getElementById('signup-username').value = '';
  document.getElementById('signup-password').value = '';
  document.getElementById('signup-password2').value = '';

  // Logout immediately so they must sign in manually
  AuthManager.logout();

  setTimeout(() => {
    goToSignIn(`✓ Account created! Sign in with your username and password.`);
    // Pre-fill username on sign in form for convenience
    document.getElementById('signin-username').value = username;
    document.getElementById('signin-password').focus();
  }, 1500);
}

function handleSignIn() {
  const username = document.getElementById('signin-username').value.trim();
  const password = document.getElementById('signin-password').value;
  const errEl    = document.getElementById('signin-error');

  errEl.classList.add('hidden');

  const result = AuthManager.signIn(username, password);

  if (!result.success) {
    errEl.textContent = '⚠ ' + result.error;
    errEl.classList.remove('hidden');
    return;
  }

  GameState.username = AuthManager.getUsername();
  startGame();
}

// ═══════════════════════════════════════════════════════════════
// LOGOUT — available on EVERY game screen via HUD button
// ═══════════════════════════════════════════════════════════════

function wireLogoutEvents() {
  document.getElementById('btn-hud-logout').addEventListener('click', handleLogout);
  document.getElementById('btn-final-logout').addEventListener('click', handleLogout);
}

function handleLogout() {
  if (!confirm('Are you sure you want to logout?')) return;
  Timer.stop(); // stop any running timer
  AuthManager.logout();
  // Reset game state
  GameState.eventsWired = false;
  // Go back to Sign In screen
  goToSignIn();
}

// ═══════════════════════════════════════════════════════════════
// GAME SETUP
// ═══════════════════════════════════════════════════════════════

function startGame() {
  GameState.score        = 0;
  GameState.round        = 1;
  GameState.cluesUsed    = 0;
  GameState.correctCount = 0;
  GameState.wrongCount   = 0;
  GameState.clueHintText = null;
  GameState.riskPuzzle   = null;

  QuizEngine.initRound();
  RiskEngine.reset();
  ClueSystem.reset();

  UiController.showScreen('screen-game');
  UiController.updateHud({ username: GameState.username, round: 1, score: 0, clues: 0 });

  if (!GameState.eventsWired) {
    wireGameEvents();
    GameState.eventsWired = true;
  }

  startRound();
}

function startRound() {
  ClueSystem.reset();
  GameState.clueHintText = null;
  GameState.riskPuzzle   = null;

  const question = QuizEngine.getQuestion(GameState.round - 1);

  UiController.showPhase('phase-question');
  UiController.renderQuestion(GameState.round, question);
  UiController.updateHud({ round: GameState.round });

  document.getElementById('btn-request-clue').disabled = false;

  // Timer tick and expire are events — event-driven programming
  Timer.start(
    (secondsLeft) => UiController.updateTimer(secondsLeft),
    () => handleTimeout()
  );
}

// ═══════════════════════════════════════════════════════════════
// GAME EVENT WIRING
// ═══════════════════════════════════════════════════════════════

function wireGameEvents() {
  document.getElementById('options-container').addEventListener('click', handleOptionClick);

  document.getElementById('btn-request-clue').addEventListener('click', handleClueRequest);
  document.getElementById('btn-close-clue').addEventListener('click', () => UiController.hideClueModal());
  document.getElementById('btn-submit-clue').addEventListener('click', handleClueSubmit);
  document.getElementById('clue-answer-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleClueSubmit();
  });

  document.getElementById('btn-to-risk').addEventListener('click', startRiskPhase);
  document.getElementById('risk-buttons').addEventListener('click', handleRiskDecision);
  document.getElementById('btn-next-round').addEventListener('click', handleNextRound);
  document.getElementById('btn-play-again').addEventListener('click', handlePlayAgain);
}

// ═══════════════════════════════════════════════════════════════
// ANSWER HANDLING
// ═══════════════════════════════════════════════════════════════

function handleOptionClick(event) {
  const btn = event.target.closest('.option-btn');
  if (!btn || btn.disabled) return;

  Timer.stop();

  const chosenIndex = Number(btn.dataset.index);
  const roundIndex  = GameState.round - 1;
  const { correct, correctIndex } = QuizEngine.checkAnswer(roundIndex, chosenIndex);

  UiController.highlightAnswer(correctIndex, chosenIndex);

  if (correct) {
    GameState.score += 10;
    GameState.correctCount++;
  } else {
    GameState.score -= 5;
    GameState.wrongCount++;
  }

  if (ClueSystem.wasClueUsed()) {
    GameState.score -= 2;
  }

  UiController.updateHud({ score: GameState.score });

  setTimeout(() => {
    UiController.showAnswerResult({
      correct,
      timedOut:  false,
      hintText:  GameState.clueHintText
    });
  }, 700);
}

function handleTimeout() {
  GameState.score -= 5;
  GameState.wrongCount++;
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  UiController.updateHud({ score: GameState.score });
  UiController.showAnswerResult({ correct: false, timedOut: true, hintText: null });
}

// ═══════════════════════════════════════════════════════════════
// CLUE SYSTEM
// ═══════════════════════════════════════════════════════════════

async function handleClueRequest() {
  document.getElementById('btn-request-clue').disabled = true;
  UiController.showClueModal();

  try {
    const puzzle = await ClueSystem.loadPuzzle();
    UiController.setPuzzleImage(puzzle.imageUrl);
  } catch (err) {
    console.error('Clue load error:', err);
    UiController.showClueApiError();
  }
}

function handleClueSubmit() {
  const input = document.getElementById('clue-answer-input');
  const val   = input.value.trim();

  if (!val || isNaN(val) || Number(val) < 1 || Number(val) > 13) {
    UiController.showClueResult(false, '⚠ Enter a number between 1 and 13.');
    return;
  }

  const correct = ClueSystem.validateAnswer(Number(val));

  if (correct) {
    ClueSystem.markClueUsed();
    GameState.cluesUsed++;
    UiController.updateHud({ clues: GameState.cluesUsed });
    UiController.showClueResult(true, '✓ Correct heart count! Hint will appear below your answers.');
    document.getElementById('btn-submit-clue').disabled = true;

    // Set hint text & show it below options when modal closes
    const hintText = QuizEngine.getHint(GameState.round - 1);
    GameState.clueHintText = hintText;

    setTimeout(() => {
      UiController.hideClueModal();
      UiController.showClueHint(hintText);
    }, 1500);

  } else {
    UiController.showClueResult(false, '✗ Wrong count — look carefully! Timer is still running.');
    input.value = '';
    input.focus();
  }
}

// ═══════════════════════════════════════════════════════════════
// RISK PHASE
// ═══════════════════════════════════════════════════════════════

async function startRiskPhase() {
  UiController.showPhase('phase-risk');

  document.getElementById('risk-loading-msg').classList.remove('hidden');
  document.getElementById('risk-fetch-status').textContent = 'Fetching Heart API risk value…';
  document.querySelectorAll('.btn-risk').forEach(b => b.disabled = true);

  try {
    GameState.riskPuzzle = await ApiService.fetchHeartPuzzle();
    document.getElementById('risk-fetch-status').textContent = '✓ Risk value secured (hidden from you)';
  } catch (err) {
    console.error('Risk API error:', err);
    GameState.riskPuzzle = { solution: Math.floor(Math.random() * 13) + 1 };
    document.getElementById('risk-fetch-status').textContent = '⚠ API offline — random fallback used';
  }

  document.getElementById('risk-loading-msg').classList.add('hidden');
  document.querySelectorAll('.btn-risk').forEach(b => b.disabled = false);
}

function handleRiskDecision(event) {
  const btn = event.target.closest('.btn-risk');
  if (!btn || btn.disabled) return;

  document.querySelectorAll('.btn-risk').forEach(b => b.disabled = true);

  const decision = btn.dataset.decision;
  const outcome  = RiskEngine.calculateOutcome(decision, GameState.riskPuzzle.solution);
  GameState.score += outcome.points;

  UiController.updateHud({ score: GameState.score });

  if (GameState.round === GameState.totalRounds) {
    document.getElementById('btn-next-round').textContent = 'VIEW FINAL RESULTS →';
  }

  UiController.showRiskResult({
    decision,
    heartValue: GameState.riskPuzzle.solution,
    tierLabel:  outcome.tierLabel,
    points:     outcome.points,
    newScore:   GameState.score
  });
}

// ═══════════════════════════════════════════════════════════════
// ROUND / GAME END
// ═══════════════════════════════════════════════════════════════

function handleNextRound() {
  if (GameState.round >= GameState.totalRounds) {
    endGame();
    return;
  }
  GameState.round++;
  document.getElementById('btn-next-round').textContent = 'NEXT ROUND →';
  startRound();
}

function endGame() {
  const profile      = RiskEngine.getBehaviourProfile();
  const behaviourMsg = RiskEngine.getBehaviourMessage(profile);

  UiController.showFinalScreen({
    username:    GameState.username,
    score:       GameState.score,
    correct:     GameState.correctCount,
    wrong:       GameState.wrongCount,
    cluesUsed:   GameState.cluesUsed,
    profile,
    behaviourMsg
  });
}

function handlePlayAgain() {
  startGame();
}

// ═══════════════════════════════════════════════════════════════
// COOKIE CONSENT BANNER
// Shown on first visit. Consent stored in localStorage.
// Banner never shown again once player has accepted or declined.
// ═══════════════════════════════════════════════════════════════

function wireCookieConsent() {
  const consent = localStorage.getItem('riskmatrix_cookie_consent');

  // Already decided — do not show banner again
  if (consent === 'accepted' || consent === 'declined') return;

  // First visit — show the banner
  const banner = document.getElementById('cookie-banner');
  banner.classList.remove('hidden');

  document.getElementById('btn-cookie-accept').addEventListener('click', () => {
    // Player accepted — save consent, set cookie if already signed in
    localStorage.setItem('riskmatrix_cookie_consent', 'accepted');
    banner.classList.add('hidden');

    // If player is already logged in, set the cookie now retroactively
    const username = AuthManager.getUsername();
    if (username) AuthManager.reApplyCookie(username);
  });

  document.getElementById('btn-cookie-decline').addEventListener('click', () => {
    // Player declined — save decision, hide banner, no cookie ever set
    localStorage.setItem('riskmatrix_cookie_consent', 'declined');
    banner.classList.add('hidden');
  });
}