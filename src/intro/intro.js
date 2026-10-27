/**
 * intro.js — Start-up intro controller (markup: #bsm-intro in index.html)
 *
 * window.__bsmIntro:
 *   status(text, sub?)  — update the lines under the equalizer
 *   ready()             — the app is up: Tasky turns happy, then the splash
 *                         fades. Never before the entrance has played in full
 *                         (MIN_MS), so a fast boot still shows the animation.
 * A click or any key skips the entrance; if the app is already ready the
 * splash goes at once.
 */

import './intro.css';

const MIN_MS = 2600;      // entrance length (the wordmark ends at ~2.3 s)
const HAPPY_MS = 650;     // Tasky's happy beat before the fade
const FADE_MS = 600;

const root = document.getElementById('bsm-intro');
const startedAt = performance.now();
let isReady = false;
let skipped = false;
let finished = false;

function status(text, sub) {
    if (!root) return;
    const s = root.querySelector('.bi-status');
    if (s && text != null) s.textContent = text;
    const ss = root.querySelector('.bi-sub');
    if (ss && sub != null) ss.textContent = sub;
}

function finish() {
    if (!root || finished) return;
    finished = true;
    root.classList.add('is-ready');
    setTimeout(() => {
        root.classList.add('is-done');
        root.setAttribute('aria-busy', 'false');
        setTimeout(() => root.remove(), FADE_MS);
        cleanup();
    }, skipped ? 150 : HAPPY_MS);
}

function ready() {
    isReady = true;
    const wait = skipped ? 0 : Math.max(0, MIN_MS - (performance.now() - startedAt));
    setTimeout(finish, wait);
}

function skip(e) {
    if (!root || finished) return;
    if (e?.type === 'pointerdown') {
        const r = document.createElement('div');
        r.className = 'bi-ripple';
        r.style.left = `${e.clientX}px`;
        r.style.top = `${e.clientY}px`;
        root.appendChild(r);
        setTimeout(() => r.remove(), 700);
    }
    skipped = true;
    root.classList.add('is-skipped');
    if (isReady) finish();
}

// The stage follows the mouse a little
function parallax(e) {
    const stage = root.querySelector('.bi-stage');
    if (!stage) return;
    stage.style.setProperty('--mx', `${(e.clientX / innerWidth - 0.5) * -14}px`);
    stage.style.setProperty('--my', `${(e.clientY / innerHeight - 0.5) * -10}px`);
}

function cleanup() {
    root?.removeEventListener('pointerdown', skip);
    removeEventListener('keydown', skip, true);
    removeEventListener('pointermove', parallax);
}

if (root) {
    // Split the wordmark into letters
    root.querySelectorAll('.bi-w1, .bi-w2').forEach((word, w) => {
        const text = word.textContent;
        word.textContent = '';
        [...text].forEach((ch, i) => {
            const span = document.createElement('span');
            span.className = 'bi-char';
            span.style.setProperty('--i', String(i + w * 6));
            span.textContent = ch;
            word.appendChild(span);
        });
    });
    root.addEventListener('pointerdown', skip);
    addEventListener('keydown', skip, true);
    addEventListener('pointermove', parallax);
}

window.__bsmIntro = { status, ready };
