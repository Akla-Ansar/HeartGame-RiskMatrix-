/**
 * riskEngine.js
 * Probabilistic risk/reward calculator.
 *
 * The Heart API solution (integer) is reused as a hidden risk generator:
 *   0-3  → LOW RISK
 *   4-7  → MEDIUM RISK
 *   8-9  → HIGH RISK
 *
 * Reward table per decision × tier:
 *   safe:   LOW +5  MED +2  HIGH -1
 *   take:   LOW +10 MED +5  HIGH -5
 *   double: LOW +20 MED +10 HIGH -15
 *
 * HIGH COHESION: only risk calculation and behaviour analysis.
 * LOW COUPLING:  no DOM access; returns plain data.
 */

const RiskEngine = (() => {
  const REWARDS = {
    safe:   { LOW: +5,  MEDIUM: +2,  HIGH: -1  },
    take:   { LOW: +10, MEDIUM: +5,  HIGH: -5  },
    double: { LOW: +20, MEDIUM: +10, HIGH: -15 }
  };

  const TIER_LABELS = {
    LOW:    'LOW RISK',
    MEDIUM: 'MEDIUM RISK',
    HIGH:   'HIGH RISK'
  };

  const _log = []; // decision log for behaviour analysis

  function _getTier(solution) {
    if (solution <= 3) return 'LOW';
    if (solution <= 7) return 'MEDIUM';
    return 'HIGH';
  }

  function calculateOutcome(decision, solution) {
    const tier   = _getTier(solution);
    const points = REWARDS[decision][tier];
    _log.push(decision);
    return { tier, tierLabel: TIER_LABELS[tier], points };
  }

  function getBehaviourProfile() {
    if (!_log.length) return 'UNDEFINED';
    const c = { safe: 0, take: 0, double: 0 };
    _log.forEach(d => { if (c[d] !== undefined) c[d]++; });
    const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
    return top === 'safe' ? 'CONSERVATIVE' : top === 'take' ? 'BALANCED' : 'AGGRESSIVE';
  }

  function getBehaviourMessage(profile) {
    const msgs = {
      CONSERVATIVE: "Your strategic behaviour indicates a CONSERVATIVE risk profile. You prioritised stability and loss-avoidance over high reward — a disciplined, risk-averse approach typical of security-conscious decision makers.",
      BALANCED:     "Your strategic behaviour indicates a BALANCED risk profile. You weighed risk against reward carefully, demonstrating measured decision-making under uncertainty — the hallmark of an effective analyst.",
      AGGRESSIVE:   "Your strategic behaviour indicates an AGGRESSIVE risk profile. You repeatedly committed to high-reward, high-risk decisions. Bold and potentially decisive — but one bad call can be catastrophic.",
      UNDEFINED:    "Insufficient data to classify a clear risk profile."
    };
    return msgs[profile] || msgs.UNDEFINED;
  }

  function reset() { _log.length = 0; }

  return { calculateOutcome, getBehaviourProfile, getBehaviourMessage, reset };
})();