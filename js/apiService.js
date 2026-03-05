/**
 * apiService.js
 * ─────────────────────────────────────────────────────────────
 * Responsible for ALL communication with the Heart Game API.
 * Demonstrates: Interoperability via RESTful HTTP, async/await,
 * and separation of concerns (no UI logic here).
 *
 * Heart API base URL: https://marcconrad.com/uob/heart/api.php
 * Returns JSON: { question: "<img_url>", solution: <1-13> }
 * ─────────────────────────────────────────────────────────────
 */

const ApiService = (() => {

  const BASE_URL = 'https://marcconrad.com/uob/heart/api.php';

  /**
   * Fetches a Heart puzzle from the external API.
   * Returns: { question: string (image URL), solution: number }
   * Throws on network/parse failure.
   */
  async function fetchHeartPuzzle() {
    const url = `${BASE_URL}?out=json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Heart API returned status ${response.status}`);
    }

    const data = await response.json();

    // Validate expected shape
    if (typeof data.question === 'undefined' || typeof data.solution === 'undefined') {
      throw new Error('Unexpected Heart API response shape');
    }

    return {
      imageUrl: data.question,   // URL of the puzzle image
      solution: Number(data.solution) // integer 1–13
    };
  }

  // Public interface
  return { fetchHeartPuzzle };

})();