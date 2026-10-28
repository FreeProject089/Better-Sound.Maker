/**
 * intro.js — Start-up splash controller (markup: #bsm-intro in index.html)
 *
 * window.__bsmIntro.status(text, sub?) updates the loading line;
 * window.__bsmIntro.ready() shows Tasky happy for a beat, then fades out.
 * A click or a key closes it as soon as the app is ready.
 */

import './intro.css';

const MIN_MS = 900;    // long enough to read the name, no longer
const HAPPY_MS = 450;
const FADE_MS = 450;

const root = document.getElementById('bsm-intro');
const startedAt = performance.now();
let isReady = false;
let finished = false;

function status(text, sub) {
    if (!root) return;
    if (text != null) root.querySelector('.bi-status').textContent = text;
    if (sub != null) root.querySelector('.bi-sub').textContent = sub;
}

function finish(fast = false) {
    if (!root || finished) return;
    finished = true;
    root.classList.add('is-ready');
    setTimeout(() => {
        root.classList.add('is-done');
        root.setAttribute('aria-busy', 'false');
        setTimeout(() => root.remove(), FADE_MS);
    }, fast ? 0 : HAPPY_MS);
}

function ready() {
    isReady = true;
    setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - startedAt)));
}

const skip = () => { if (isReady) finish(true); };
root?.addEventListener('pointerdown', skip);
addEventListener('keydown', skip, { once: true });

window.__bsmIntro = { status, ready };
