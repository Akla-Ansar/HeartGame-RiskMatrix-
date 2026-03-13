/**
 * timer.js
 * EVENT-DRIVEN: generates onTick and onExpire events via callbacks.
 * HIGH COHESION: only manages countdown logic.
 * LOW COUPLING: never touches the DOM.
 */

const Timer = (() => {
  const TOTAL = 30;
  let _intervalId = null;
  let _remaining  = TOTAL;
  let _onTick     = null;
  let _onExpire   = null;

  function start(onTick, onExpire) {
    stop();
    _remaining = TOTAL;
    _onTick    = onTick;
    _onExpire  = onExpire;
    if (_onTick) _onTick(_remaining);
    _intervalId = setInterval(() => {
      _remaining -= 1;
      if (_onTick) _onTick(_remaining);     // ← TICK fires every 1000ms
      if (_remaining <= 0) { stop(); if (_onExpire) _onExpire(); }    
    }, 1000);
  }

  function stop() {
    if (_intervalId !== null) { clearInterval(_intervalId); _intervalId = null; }
  }

  function getRemaining() { return _remaining; }

  return { start, stop, getRemaining, TOTAL };
})();