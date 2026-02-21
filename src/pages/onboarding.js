/**
 * onboarding.js — Duolingo-style first-run tutorial
 * Better Sound.Maker
 *
 * Shows a mascot character with speech bubble that walks the user
 * through each page of the app. Supports skip and "don't show again".
 */

import { changeLanguage, getAvailableLanguages, t } from '../utils/i18n.js';

const ONBOARDING_KEY = 'bsm-onboarding-done';

// Image assets (assumed to be in public or root served by Vite)
const IMG_TASKY = './Tasky.webp';
const IMG_TASKY_EYES = './Tasky_yeux1.webp';
const IMG_TASKY_HAPPY = './Tasky_Happy.webp';

const STEPS = [
    {
        page: 'language-select', // Special step
        title: '🌍 Welcome / Bienvenue',
        text: 'Please select your language to get started.<br>Veuillez choisir votre langue pour commencer.',
        // textKey: 'tutorial.language', // Special handling in render causing formatted HTML, keep raw for now or handle in render
        image: IMG_TASKY
    },
    {
        page: 'library',
        title: '📁 Assets Library',
        titleKey: 'nav.library',
        text: 'This is where you browse and select DCS sound assets. Navigate the folder tree and check the files you want to replace with your custom audio.',
        textKey: 'tutorial.library',
        image: IMG_TASKY_EYES
    },
    {
        page: 'project',
        title: '📂 Your Project',
        titleKey: 'nav.projects',
        text: 'Here you configure your mod details — name, aircraft, version. All selected assets appear here so you can review them.',
        textKey: 'tutorial.project',
        image: IMG_TASKY
    },
    {
        page: 'sdef-editor',
        title: '🎛️ SDEF Editor',
        titleKey: 'nav.sdef',
        text: 'Each sound asset needs an .sdef file. The visual editor lets you tweak volume, looping, distance, pitch and more — no code needed!',
        textKey: 'tutorial.sdef',
        image: IMG_TASKY_EYES
    },
    {
        page: 'theme',
        title: '🎨 Theme',
        titleKey: 'nav.theme',
        text: 'Customise the look of the app. Change the background image and accent colors to make it feel like yours.',
        textKey: 'tutorial.theme',
        image: IMG_TASKY
    },
    {
        page: 'presets',
        title: '💾 Presets',
        titleKey: 'nav.presets',
        text: 'Save and load your SDEF parameter presets. Great for reusing settings across different mods.',
        textKey: 'tutorial.presets',
        image: IMG_TASKY
    },
    {
        page: 'collaboration',
        title: '🤝 Collaboration',
        titleKey: 'nav.collab',
        text: 'Connect to a GitHub repo to sync your project with teammates. Push your mod build, leave notes, and restore earlier versions.',
        textKey: 'tutorial.collab',
        image: IMG_TASKY
    },
    {
        page: 'build',
        title: '🚀 Build Mod',
        titleKey: 'nav.builder',
        text: 'When you\'re ready, hit Build to generate the complete mod folder — entry.lua, .sdef files, and your audio — ready to drop into DCS Mods.',
        textKey: 'tutorial.build',
        image: IMG_TASKY_EYES
    },
    {
        page: 'docs',
        title: '📖 Documentation',
        titleKey: 'nav.docs',
        text: 'Everything you need to know about DCS sound modding: file formats, parameters, tips and examples.',
        textKey: 'tutorial.docs',
        image: IMG_TASKY
    },
    {
        page: 'docs', // Will navigate to docs page (we can leave it so it stays there)
        title: '📋 sdef_and_wave_list.txt',
        titleKey: 'tutorial.sdeflistTitle',
        text: 'The full index of sound events is located in your DCS folder at <code>\\DCS World\\Doc\\Sounds\\sdef_and_wave_list.txt</code>. Open the "Sdef List" tab to learn more.',
        textKey: 'tutorial.sdeflist',
        image: IMG_TASKY_EYES
    },
    {
        page: 'credits',
        title: '⭐ Credits',
        text: 'Info about the app, the developer, and useful community links. You\'re all set — happy modding! 🎧',
        textKey: 'tutorial.credits',
        image: IMG_TASKY_HAPPY,
        isLast: true,
    },
];

let currentStep = 0;
let overlayEl = null;
let spotlightEl = null;

export function startOnboarding() {
    localStorage.removeItem(ONBOARDING_KEY);
    if (document.getElementById('onboarding-overlay')) document.getElementById('onboarding-overlay').remove();
    if (document.getElementById('onboarding-mascot-wrap')) document.getElementById('onboarding-mascot-wrap').remove();
    currentStep = 0;
    initOnboarding();
}

export function initOnboarding() {
    // Don't show if already dismissed
    if (localStorage.getItem(ONBOARDING_KEY) === 'true') return;

    // Create overlay
    overlayEl = document.createElement('div');
    overlayEl.id = 'onboarding-overlay';
    overlayEl.innerHTML = `
    <div class="onboarding-backdrop" id="onboarding-backdrop"></div>
    <div class="onboarding-spotlight" id="onboarding-spotlight"></div>
  `;
    document.body.appendChild(overlayEl);

    // Create mascot+bubble container
    const mascotWrapEl = document.createElement('div');
    mascotWrapEl.className = 'onboarding-mascot-wrap';
    mascotWrapEl.id = 'onboarding-mascot-wrap';
    mascotWrapEl.innerHTML = `
        <div class="mascot-image-container">
            <img id="onboarding-mascot-img" src="${IMG_TASKY}" alt="Tasky" class="onboarding-mascot-img" />
        </div>
        <div class="onboarding-bubble" id="onboarding-bubble">
            <!-- Content injected via JS -->
        </div>
    `;
    document.body.appendChild(mascotWrapEl);

    spotlightEl = document.getElementById('onboarding-spotlight');

    // Activate
    overlayEl.classList.add('active');

    showStep(0);
}

function showStep(idx) {
    currentStep = idx;
    const step = STEPS[idx];

    // Special handling for language selection step
    if (step.page === 'language-select') {
        renderBubble(step, idx);
        // Center spotlight or hide it
        spotlightEl.style.opacity = '0';
        return;
    }

    // Navigate to the highlighted page
    import('../state/store.js').then(({ navigate }) => {
        navigate(step.page);
    });

    // Wait a tick for nav item to render, then spotlight it
    requestAnimationFrame(() => {
        setTimeout(() => {
            const navItem = document.querySelector(`.nav-item[data-page="${step.page}"]`);

            // USER REQUEST: Hide backdrop on Step 1 (Library) so they can interact
            // Step 0 = Lang, Step 1 = Library
            // USER REQUEST: Hide backdrop on Step 1+ (Library, etc) so they can interact
            const backdropEl = document.getElementById('onboarding-backdrop');
            if (backdropEl) {
                if (idx >= 1) {
                    backdropEl.style.display = 'none'; // Allow interaction
                    spotlightEl.style.display = 'none'; // Hide spotlight too as it might block or look weird
                } else {
                    backdropEl.style.display = 'block';
                    spotlightEl.style.display = 'block';
                }
            }

            if (navItem && spotlightEl && idx < 1) { // Only spotlight on step 0 if needed (or if we revert backdrop logic)
                // ... unused logic for now if spotlight is hidden >= 1 ...
            }

            // Still scroll to item
            if (navItem) {
                navItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            renderBubble(step, idx);
        }, 300); // Slight delay for scroll
    });
}

function renderBubble(step, idx) {
    const mascotWrapEl = document.getElementById('onboarding-mascot-wrap');
    const bubbleEl = document.getElementById('onboarding-bubble');
    const imgEl = document.getElementById('onboarding-mascot-img');

    if (!mascotWrapEl || !bubbleEl) return;

    // Update Image
    if (imgEl && step.image) {
        imgEl.src = step.image;
        // Add animation class to pop
        imgEl.classList.remove('pop-anim');
        void imgEl.offsetWidth; // trigger reflow
        imgEl.classList.add('pop-anim');
    }

    // Position
    const isMobile = window.innerWidth <= 768;
    const bottom = isMobile ? 80 : 32;
    const left = isMobile ? 12 : 280;

    // For language select, center it
    if (step.page === 'language-select') {
        mascotWrapEl.style.cssText = `
            bottom: 50%;
            left: 50%;
            transform: translate(-50%, 50%);
            z-index: 10002;
         `;
    } else {
        mascotWrapEl.style.cssText = `
            bottom: ${bottom}px;
            left: ${left}px;
         `;
    }

    const isLast = step.isLast || idx === STEPS.length - 1;

    // Content
    let contentHtml = '';

    if (step.page === 'language-select') {
        const languages = getAvailableLanguages();
        const enObj = languages.find(l => l.code === 'en') || { flag: '🇺🇸', name: 'English' };
        const frObj = languages.find(l => l.code === 'fr') || { flag: '🇫🇷', name: 'Français' };

        contentHtml = `
            <div class="onboarding-bubble-title">${step.title}</div>
            <div class="onboarding-bubble-text">${step.text}</div>
            <div class="onboarding-lang-buttons" style="display:flex; gap:12px; justify-content:center; margin-top:20px;">
                <button class="btn btn-primary" id="lang-en" style="display:flex; align-items:center; gap:8px; padding:10px 20px;">
                    ${enObj.flag} <span>${enObj.name}</span>
                </button>
                <button class="btn btn-primary" id="lang-fr" style="display:flex; align-items:center; gap:8px; padding:10px 20px;">
                    ${frObj.flag} <span>${frObj.name}</span>
                </button>
            </div>
         `;
    } else {
        const title = step.titleKey && t(step.titleKey) !== step.titleKey ? t(step.titleKey) : step.title;
        const dotsHtml = STEPS.map((_, i) =>
            `<div class="onboarding-dot ${i === idx ? 'active' : ''}"></div>`
        ).join('');

        contentHtml = `
            <div class="onboarding-bubble-header">
                <span class="onboarding-mascot-name">Tasky</span>
                <div class="onboarding-bubble-dots">${dotsHtml}</div>
            </div>
            <div class="onboarding-bubble-step">Step ${idx} / ${STEPS.length - 1}</div>
            <div class="onboarding-bubble-title">${title}</div>
            <div class="onboarding-bubble-text" id="onboarding-text-content"></div>
            <div class="onboarding-bubble-actions">
                ${idx > 1 ? `<button class="onboarding-btn-prev" id="onboarding-prev" style="background:transparent; border:1px solid var(--border-default); color:var(--text-secondary); padding:6px 12px; border-radius:6px; cursor:pointer;">←</button>` : ''}
                <button class="onboarding-btn-next" id="onboarding-next">
                ${isLast ? "🎉 " + t('common.finish') : t('common.next') + ' →'}
                </button>
                <button class="onboarding-btn-skip" id="onboarding-skip">${t('tutorial.skip') || 'Skip'}</button>
            </div>
         `;
    }

    bubbleEl.innerHTML = contentHtml;

    // Typewriter effect for text
    const textTarget = document.getElementById('onboarding-text-content');
    if (textTarget) {
        const text = step.textKey && t(step.textKey) !== step.textKey ? t(step.textKey) : step.text;
        let i = 0;
        const speed = 10; // Fast
        textTarget.innerHTML = '';

        function type() {
            if (i < text.length) {
                // Handle basic HTML if present (like <br>)
                if (text.substr(i, 4) === '<br>') {
                    textTarget.innerHTML += '<br>';
                    i += 4;
                } else {
                    textTarget.innerHTML += text.charAt(i);
                    i++;
                }
                setTimeout(type, speed);
            }
        }
        type();
    }

    if (step.page === 'language-select') {
        document.getElementById('lang-en')?.addEventListener('click', () => {
            changeLanguage('en');
            showStep(idx + 1);
        });
        document.getElementById('lang-fr')?.addEventListener('click', () => {
            changeLanguage('fr');
            showStep(idx + 1);
        });
    } else {
        document.getElementById('onboarding-next')?.addEventListener('click', () => {
            if (isLast) {
                closeOnboarding(true); // Mark done
            } else {
                showStep(idx + 1);
            }
        });

        document.getElementById('onboarding-prev')?.addEventListener('click', () => {
            showStep(idx - 1);
        });

        document.getElementById('onboarding-skip')?.addEventListener('click', () => {
            closeOnboarding(true); // Mark done even if skipped!
        });
    }
}

function closeOnboarding(markDone) {
    overlayEl?.remove();
    document.getElementById('onboarding-mascot-wrap')?.remove();
    overlayEl = null;

    if (markDone) {
        localStorage.setItem(ONBOARDING_KEY, 'true');
    }
}

export function restartTutorial() {
    localStorage.removeItem(ONBOARDING_KEY);
    initOnboarding();
}
