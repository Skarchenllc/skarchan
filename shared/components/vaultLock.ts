// Global idle-timeout watcher. When the user has been idle for IDLE_MS
// (no mouse / keyboard / focus / touch events), dispatches a custom
// 'vault-lock' event on window so any sensitive UI (revealed passwords,
// unmasked notes) can re-hide itself.
//
// Components opt-in by listening with: window.addEventListener('vault-lock', fn).

const IDLE_MS = 5 * 60 * 1000; // 5 minutes

let timer: ReturnType<typeof setTimeout> | null = null;
let installed = false;

function fire() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vault-lock'));
  }
}

function reset() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(fire, IDLE_MS);
}

export function ensureVaultLockInstalled() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'focus'].forEach(ev =>
    window.addEventListener(ev, reset, { passive: true })
  );
  reset();
}
