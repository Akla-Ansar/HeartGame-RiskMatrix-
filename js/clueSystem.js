/**
 * clueSystem.js
 * Manages the Heart API clue sub-system.
 * Player sees a heart image, counts hearts, submits — if correct,
 * a cybersecurity hint is unlocked.
 *
 * INTEROPERABILITY: fetches puzzles from external Heart API via ApiService.
 * HIGH COHESION: only manages clue fetch/validate state.
 * LOW COUPLING: depends only on ApiService; no DOM access.
 */

const ClueSystem = (() => {
  let _puzzle     = null;  // { imageUrl, solution }
  let _clueUsed   = false; // was clue correctly solved this round?

  async function loadPuzzle() {
    _puzzle   = await ApiService.fetchHeartPuzzle();
    _clueUsed = false;
    return _puzzle;
  }

  function validateAnswer(playerAnswer) {
    if (!_puzzle) return false;
    return Number(playerAnswer) === _puzzle.solution;
  }

  function markClueUsed()  { _clueUsed = true; }
  function wasClueUsed()   { return _clueUsed; }

  function reset() {
    _puzzle   = null;
    _clueUsed = false;
  }

  return { loadPuzzle, validateAnswer, markClueUsed, wasClueUsed, reset };
})();