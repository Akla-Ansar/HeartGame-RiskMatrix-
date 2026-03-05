/**
 * uiController.js
 * ─────────────────────────────────────────────────────────────
 * Handles ALL DOM manipulation and visual rendering.
 *
 * High cohesion: only responsible for updating the interface.
 * Low coupling: receives plain data as arguments — zero game logic.
 *
 * This is the only module that touches HTML elements directly,
 * demonstrating strict separation of concerns.
 * ─────────────────────────────────────────────────────────────
 */

const UiController = (() => {

  // ── Screen Management ────────────────────────────────────────
  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
  }

  // ── Phase Management ─────────────────────────────────────────
  function showPhase(phaseId) {
    document.querySelectorAll('.phase').forEach(p => {
      p.classList.remove('active');
      p.classList.add('hidden');
    });
    const target = document.getElementById(phaseId);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('active');
    }
  }

  // ── HUD ──────────────────────────────────────────────────────
  function updateHud({ username, round, score, clues }) {
    if (username !== undefined) document.getElementById('hud-username').textContent = username;
    if (round    !== undefined) document.getElementById('hud-round').textContent    = round;
    if (score    !== undefined) {
      const el = document.getElementById('hud-score');
      el.textContent = score;
      el.classList.remove('score-flash');
      void el.offsetWidth;
      el.classList.add('score-flash');
    }
    if (clues !== undefined) document.getElementById('hud-clues').textContent = clues;
  }

  // ── Timer ────────────────────────────────────────────────────
  function updateTimer(secondsLeft) {
    document.getElementById('timer-display').textContent = secondsLeft;
    const circumference = 163.4;
    const fraction      = secondsLeft / Timer.TOTAL_SECONDS;
    document.getElementById('timer-circle').style.strokeDashoffset =
      circumference * (1 - fraction);
    const container = document.querySelector('.timer-ring-container');
    if (secondsLeft <= 10) container.classList.add('timer-urgent');
    else container.classList.remove('timer-urgent');
  }

  // ── Question Phase ───────────────────────────────────────────
  function renderQuestion(roundNumber, question) {
    document.getElementById('question-number').textContent = `Q${roundNumber} of 5`;
    document.getElementById('question-text').textContent   = question.text;

    // Reset hint box — hidden at start of every round
    const hintBox = document.getElementById('clue-hint-box');
    hintBox.classList.add('hidden');
    hintBox.classList.remove('hint-reveal');
    document.getElementById('clue-hint-text').textContent = '';

    const container = document.getElementById('options-container');
    container.innerHTML = '';

    ['A','B','C','D'].forEach((letter, index) => {
      const btn = document.createElement('button');
      btn.className     = 'option-btn';
      btn.dataset.index = index;
      btn.innerHTML     = `<span class="opt-letter">${letter}.</span>${question.options[index]}`;
      container.appendChild(btn);
    });
  }

  function highlightAnswer(correctIndex, chosenIndex) {
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.disabled = true;
      const idx = Number(btn.dataset.index);
      if (idx === correctIndex) btn.classList.add('correct');
      if (idx === chosenIndex && chosenIndex !== correctIndex) btn.classList.add('incorrect');
    });
  }

  // ── Clue Modal ───────────────────────────────────────────────
  function showClueModal() {
    document.getElementById('phase-clue-modal').classList.remove('hidden');
    document.getElementById('clue-result').className = 'clue-result hidden';
    document.getElementById('clue-answer-input').value = '';
    const img = document.getElementById('clue-puzzle-img');
    img.src            = '';
    img.style.display  = 'none';
    document.getElementById('clue-loading').style.display    = 'flex';
    document.getElementById('clue-api-error').classList.add('hidden');
    document.getElementById('btn-submit-clue').disabled = false;
  }

  function hideClueModal() {
    document.getElementById('phase-clue-modal').classList.add('hidden');
  }

  function setPuzzleImage(imageUrl) {
    const loading = document.getElementById('clue-loading');
    const img     = document.getElementById('clue-puzzle-img');
    img.onload  = () => { loading.style.display = 'none'; img.style.display = 'block'; };
    img.onerror = () => { showClueApiError(); };
    img.src = imageUrl;
  }

  function showClueApiError() {
    document.getElementById('clue-loading').style.display = 'none';
    document.getElementById('clue-api-error').classList.remove('hidden');
  }

  // ── Show hint BELOW the 4 answer options on question screen ─
  function showClueHint(hintText) {
    const box = document.getElementById('clue-hint-box');
    document.getElementById('clue-hint-text').textContent = hintText;
    box.classList.remove('hidden');
    // Trigger slide-in animation
    box.classList.remove('hint-reveal');
    void box.offsetWidth;
    box.classList.add('hint-reveal');
  }

  function showClueResult(success, message) {
    const el = document.getElementById('clue-result');
    el.textContent = message;
    el.className   = `clue-result ${success ? 'success' : 'fail'}`;
  }

  // ── Answer Result ─────────────────────────────────────────────
  // The clue hint (hintText) is shown INLINE on this same screen,
  // directly below the correct/incorrect status — not on a separate screen.
  function showAnswerResult({ correct, timedOut, hintText }) {
    showPhase('phase-result');

    const iconEl   = document.getElementById('result-icon');
    const titleEl  = document.getElementById('result-title');
    const detailEl = document.getElementById('result-detail');
    const card     = document.querySelector('.result-card');

    card.classList.remove('result-correct', 'result-incorrect', 'result-timeout');

    if (timedOut) {
      iconEl.textContent   = '⏱';
      titleEl.textContent  = 'TIME OUT';
      detailEl.textContent = '–5 points · Timer expired';
      card.classList.add('result-timeout');
    } else if (correct) {
      iconEl.textContent   = '✓';
      titleEl.textContent  = 'CORRECT';
      detailEl.textContent = '+10 points' + (hintText ? '  ·  –2 pts clue used' : '');
      card.classList.add('result-correct');
    } else {
      iconEl.textContent   = '✗';
      titleEl.textContent  = 'INCORRECT';
      detailEl.textContent = '–5 points' + (hintText ? '  ·  –2 pts clue used' : '');
      card.classList.add('result-incorrect');
    }

    // Hint is already visible on the question screen (shown when clue modal closes).
    // Nothing to do here for hints.
  }

  // ── Risk Result ──────────────────────────────────────────────
  function showRiskResult({ decision, heartValue, tierLabel, points, newScore }) {
    showPhase('phase-risk-result');

    document.getElementById('reveal-heart-value').textContent    = heartValue;
    document.getElementById('risk-tier-reveal').textContent      = tierLabel;
    document.getElementById('risk-decision-display').textContent = decision.toUpperCase();
    document.getElementById('risk-tier-display').textContent     = tierLabel;
    document.getElementById('risk-points-display').textContent   = (points >= 0 ? '+' : '') + points;
    document.getElementById('risk-new-score').textContent        = newScore;

    const tierEl = document.getElementById('risk-tier-reveal');
    if (tierLabel.includes('LOW'))    tierEl.style.color = 'var(--accent3)';
    else if (tierLabel.includes('HIGH')) tierEl.style.color = 'var(--danger)';
    else                              tierEl.style.color = 'var(--warn)';

    const ptsEl = document.getElementById('risk-points-display');
    ptsEl.style.color = points >= 0 ? 'var(--accent3)' : 'var(--danger)';
  }

  // ── Final Screen ─────────────────────────────────────────────
  function showFinalScreen({ username, score, correct, wrong, cluesUsed, profile, behaviourMsg }) {
    showScreen('screen-final');
    document.getElementById('final-username-title').textContent = `AGENT ${username.toUpperCase()}`;
    document.getElementById('final-score').textContent          = score;
    document.getElementById('stat-correct').textContent         = correct;
    document.getElementById('stat-wrong').textContent           = wrong;
    document.getElementById('stat-clues').textContent           = cluesUsed;
    document.getElementById('stat-risk-profile').textContent    = profile;
    document.getElementById('behaviour-message').textContent    = behaviourMsg;
  }

  return {
    showScreen, showPhase, updateHud, updateTimer, showClueHint,
    renderQuestion, highlightAnswer,
    showClueModal, hideClueModal, setPuzzleImage,
    showClueApiError, showClueResult,
    showAnswerResult, showRiskResult, showFinalScreen
  };

})();