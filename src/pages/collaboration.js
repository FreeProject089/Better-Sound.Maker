/**
 * collaboration.js — Team sync through a GitHub repository
 *
 * Not connected: a 3-field setup (token, repository, branch) with a link that
 * pre-fills the right token scopes. Connected: a status bar (who, where, local
 * changes / team changes / up to date), Pull and Push with a commit message,
 * the history with restore, and team notes. The sync itself is in
 * src/collab/sync.js (one commit per push, the repo is a working mod).
 */

import { getCurrentLanguage } from '../utils/i18n.js';
import { getIcon } from '../utils/icons.js';
import { escapeHtml } from '../utils/html.js';
import { showToast } from '../components/toast.js';
import { showModal } from '../components/modal.js';
import { loadCollabConfig, saveCollabConfig, isConfigured, getSyncStatus, pushProject, pullProject, listCommits } from '../collab/sync.js';
import { pushNote, listNotes } from '../utils/github-api.js';
import './collaboration.css';

const TOKEN_URL = 'https://github.com/settings/tokens/new?scopes=repo&description=Better%20Sound.Maker';

const UI = {
    en: {
        title: 'Collaboration', desc: 'Work on one mod as a team through a GitHub repository. Each push is one commit, and the repository is itself a ready-to-install mod.',
        setupTitle: 'Connect a repository', setupDesc: 'Three fields and you are synced. The token stays on this computer.',
        token: 'GitHub token', tokenHelp: 'Create a token', tokenHint: 'needs the "repo" scope', repo: 'Repository', repoPh: 'owner/name', branch: 'Branch',
        connect: 'Connect', disconnect: 'Disconnect', checking: 'Checking…', connected: 'Connected as',
        upToDate: 'Up to date', local: 'Local changes not pushed', remote: 'Team pushed changes', both: 'Both sides changed', never: 'Never synced',
        pull: 'Pull', push: 'Push', msgPh: 'What changed? (e.g. New F-16 afterburner)', lastSync: 'Last sync', readOnly: 'Read-only access: you can pull but not push.',
        history: 'History', notes: 'Team notes', notePh: 'Leave a note for the team…', post: 'Post', empty: 'Nothing yet', restore: 'Restore', open: 'Open on GitHub',
        pushed: 'Pushed: {n} file(s) in one commit', nothing: 'Nothing to push, already up to date', pulled: 'Pulled {a} sound(s) and {b} audio file(s)',
        pullFirst: 'The team pushed changes. Pull them first, or your push will be refused.', confirmPull: 'Pulling replaces your local project with the repository\'s. Local changes that were not pushed are lost.',
        confirmRestore: 'Restore the project as it was at this commit? Your current project is replaced (push afterwards to share it).', refresh: 'Refresh', viewRepo: 'Open repository', clone: 'Use it as a mod', cloneDesc: 'Download the repository as a zip and extract it into Saved Games\\DCS\\Mods\\resource.',
    },
    fr: {
        title: 'Collaboration', desc: 'Travaillez à plusieurs sur un mod via un dépôt GitHub. Chaque envoi est un seul commit, et le dépôt est lui-même un mod prêt à installer.',
        setupTitle: 'Connecter un dépôt', setupDesc: 'Trois champs et c\'est synchronisé. Le jeton reste sur cet ordinateur.',
        token: 'Jeton GitHub', tokenHelp: 'Créer un jeton', tokenHint: 'nécessite la portée « repo »', repo: 'Dépôt', repoPh: 'propriétaire/nom', branch: 'Branche',
        connect: 'Connecter', disconnect: 'Déconnecter', checking: 'Vérification…', connected: 'Connecté en tant que',
        upToDate: 'À jour', local: 'Modifications locales non envoyées', remote: 'L\'équipe a envoyé des modifications', both: 'Les deux côtés ont changé', never: 'Jamais synchronisé',
        pull: 'Récupérer', push: 'Envoyer', msgPh: 'Qu\'est-ce qui a changé ? (ex. Nouvel afterburner F-16)', lastSync: 'Dernière synchro', readOnly: 'Accès en lecture seule : vous pouvez récupérer mais pas envoyer.',
        history: 'Historique', notes: 'Notes d\'équipe', notePh: 'Laissez une note à l\'équipe…', post: 'Publier', empty: 'Rien pour l\'instant', restore: 'Restaurer', open: 'Ouvrir sur GitHub',
        pushed: 'Envoyé : {n} fichier(s) en un commit', nothing: 'Rien à envoyer, déjà à jour', pulled: '{a} son(s) et {b} fichier(s) audio récupérés',
        pullFirst: 'L\'équipe a envoyé des modifications. Récupérez-les d\'abord, sinon votre envoi sera refusé.', confirmPull: 'Récupérer remplace votre projet local par celui du dépôt. Les modifications locales non envoyées sont perdues.',
        confirmRestore: 'Restaurer le projet tel qu\'il était à ce commit ? Votre projet actuel est remplacé (envoyez ensuite pour le partager).', refresh: 'Actualiser', viewRepo: 'Ouvrir le dépôt', clone: 'L\'utiliser comme mod', cloneDesc: 'Téléchargez le dépôt en zip et extrayez-le dans Saved Games\\DCS\\Mods\\resource.',
    },
};
const ui = () => UI[getCurrentLanguage() === 'fr' ? 'fr' : 'en'];
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? '');

let busy = false;
let status = null;

export function renderCollaboration(container) {
    const u = ui();
    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">${u.title}</h1>
        <p class="page-description">${u.desc}</p>
      </div>
      <div id="collab-root"></div>`;
    if (isConfigured()) renderConnected(container); else renderSetup(container);
}

/* ── Setup ──────────────────────────────────────────────────────── */

function renderSetup(container) {
    const u = ui();
    const cfg = loadCollabConfig();
    container.querySelector('#collab-root').innerHTML = `
      <div class="card collab-setup">
        <div class="collab-setup-icon">${getIcon('github', 'w-6 h-6')}</div>
        <h2>${u.setupTitle}</h2>
        <p>${u.setupDesc}</p>
        <div class="collab-fields">
          <label class="input-group"><span class="input-label">${u.token} <a href="${TOKEN_URL}" target="_blank" rel="noopener">${u.tokenHelp} ↗</a></span>
            <input type="password" class="input-field" id="c-pat" value="${escapeHtml(cfg.pat || '')}" placeholder="ghp_… / github_pat_…" autocomplete="off" />
            <small>${u.tokenHint}</small></label>
          <div class="collab-row">
            <label class="input-group"><span class="input-label">${u.repo}</span>
              <input class="input-field" id="c-repo" value="${escapeHtml(cfg.repo || '')}" placeholder="${u.repoPh}" /></label>
            <label class="input-group collab-branch"><span class="input-label">${u.branch}</span>
              <input class="input-field" id="c-branch" value="${escapeHtml(cfg.branch || 'main')}" /></label>
          </div>
        </div>
        <div class="collab-error" id="c-error" hidden></div>
        <button class="btn btn-primary" id="c-connect">${getIcon('plug-zap', 'w-4 h-4')} ${u.connect}</button>
      </div>`;

    container.querySelector('#c-connect').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const repo = container.querySelector('#c-repo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
        const next = { pat: container.querySelector('#c-pat').value.trim(), repo, branch: container.querySelector('#c-branch').value.trim() || 'main' };
        const err = container.querySelector('#c-error');
        if (!next.pat || !/^[\w.-]+\/[\w.-]+$/.test(next.repo)) { err.hidden = false; err.textContent = `${u.token} + ${u.repo} (${u.repoPh})`; return; }
        btn.disabled = true;
        btn.innerHTML = `${getIcon('loader-2', 'w-4 h-4 spin')} ${u.checking}`;
        try {
            status = await getSyncStatus(next);
            saveCollabConfig(next);
            renderConnected(container);
        } catch (ex) {
            err.hidden = false;
            err.textContent = ex.message;
            btn.disabled = false;
            btn.innerHTML = `${getIcon('plug-zap', 'w-4 h-4')} ${u.connect}`;
        }
    });
}

/* ── Connected ──────────────────────────────────────────────────── */

function renderConnected(container) {
    const u = ui();
    const cfg = loadCollabConfig();
    container.querySelector('#collab-root').innerHTML = `
      <div class="card collab-status" id="c-status"><div class="collab-skeleton">${u.checking}</div></div>
      <div class="collab-grid">
        <div class="card">
          <div class="collab-card-head">${getIcon('history', 'w-4 h-4')} <b>${u.history}</b>
            <button class="btn btn-ghost btn-sm" id="c-refresh">${getIcon('refresh-cw', 'w-3.5 h-3.5')} ${u.refresh}</button></div>
          <div id="c-history" class="collab-history"></div>
        </div>
        <div class="card">
          <div class="collab-card-head">${getIcon('message-square', 'w-4 h-4')} <b>${u.notes}</b></div>
          <div class="collab-note-form">
            <textarea class="input-field" id="c-note" rows="2" placeholder="${u.notePh}"></textarea>
            <button class="btn btn-secondary btn-sm" id="c-post">${getIcon('send', 'w-3.5 h-3.5')} ${u.post}</button>
          </div>
          <div id="c-notes" class="collab-notes"></div>
          <div class="collab-clone">${getIcon('package-open', 'w-4 h-4')}<div><b>${u.clone}</b><small>${u.cloneDesc}</small></div>
            <a class="btn btn-ghost btn-sm" href="https://github.com/${escapeHtml(cfg.repo)}/archive/refs/heads/${encodeURIComponent(cfg.branch)}.zip" target="_blank" rel="noopener">${getIcon('download', 'w-3.5 h-3.5')} zip</a></div>
        </div>
      </div>`;

    container.querySelector('#c-refresh').addEventListener('click', () => refreshAll(container));
    container.querySelector('#c-post').addEventListener('click', async () => {
        const text = container.querySelector('#c-note').value.trim();
        if (!text) return;
        const r = await pushNote(cfg.pat, cfg.repo, status?.user || 'user', text);
        if (!r.ok) { showToast(r.error, 'error'); return; }
        container.querySelector('#c-note').value = '';
        loadNotesList(container);
    });
    refreshAll(container);
}

async function refreshAll(container) {
    renderStatus(container, null);
    try {
        status = await getSyncStatus();
        renderStatus(container, status);
    } catch (e) {
        renderStatus(container, { error: e.message });
    }
    loadHistory(container);
    loadNotesList(container);
}

function renderStatus(container, s) {
    const u = ui();
    const el = container.querySelector('#c-status');
    if (!el) return;
    if (!s) { el.innerHTML = `<div class="collab-skeleton">${getIcon('loader-2', 'w-4 h-4 spin')} ${u.checking}</div>`; return; }
    const cfg = loadCollabConfig();
    if (s.error) {
        el.innerHTML = `<div class="collab-error">${escapeHtml(s.error)}</div><button class="btn btn-ghost btn-sm" id="c-disc">${u.disconnect}</button>`;
        el.querySelector('#c-disc').addEventListener('click', () => { saveCollabConfig({ ...cfg, pat: '' }); renderCollaboration(container); });
        return;
    }
    const state = !s.lastSync ? ['never', 'circle-dashed', 'neutral'] : s.local && s.remote ? ['both', 'git-merge', 'warning'] : s.remote ? ['remote', 'cloud-download', 'info'] : s.local ? ['local', 'upload', 'warning'] : ['upToDate', 'check-circle-2', 'success'];
    el.innerHTML = `
      <div class="collab-who">
        <div class="collab-avatar">${getIcon('github', 'w-5 h-5')}</div>
        <div><small>${u.connected} <b>${escapeHtml(s.user)}</b></small>
          <a href="https://github.com/${escapeHtml(s.repo)}/tree/${encodeURIComponent(s.branch)}" target="_blank" rel="noopener" class="collab-repo">${getIcon(s.private ? 'lock' : 'globe', 'w-3.5 h-3.5')} ${escapeHtml(s.repo)} <span>${getIcon('git-branch', 'w-3 h-3')} ${escapeHtml(s.branch)}</span></a></div>
        <span class="collab-pill collab-pill--${state[2]}">${getIcon(state[1], 'w-3.5 h-3.5')} ${u[state[0]]}</span>
        <button class="btn btn-ghost btn-sm collab-disc" id="c-disc" title="${u.disconnect}">${getIcon('log-out', 'w-3.5 h-3.5')}</button>
      </div>
      ${s.canPush ? '' : `<div class="collab-warn">${getIcon('eye', 'w-4 h-4')} ${u.readOnly}</div>`}
      <div class="collab-actions">
        <button class="btn ${s.remote ? 'btn-primary' : 'btn-secondary'}" id="c-pull">${getIcon('arrow-down-to-line', 'w-4 h-4')} ${u.pull}</button>
        <input class="input-field" id="c-msg" placeholder="${u.msgPh}" ${s.canPush ? '' : 'disabled'} />
        <button class="btn ${s.local && !s.remote ? 'btn-primary' : 'btn-secondary'}" id="c-push" ${s.canPush ? '' : 'disabled'}>${getIcon('arrow-up-from-line', 'w-4 h-4')} ${u.push}</button>
      </div>
      <div class="collab-progress" id="c-progress" hidden><div class="collab-bar"><i></i></div><span></span></div>
      ${s.lastSync ? `<div class="collab-last">${u.lastSync}: ${new Date(s.lastSync.at).toLocaleString()} · <code>${s.lastSync.sha.slice(0, 7)}</code></div>` : ''}`;

    el.querySelector('#c-disc').addEventListener('click', () => { saveCollabConfig({ ...cfg, pat: '' }); renderCollaboration(container); });
    el.querySelector('#c-pull').addEventListener('click', () => doPull(container));
    el.querySelector('#c-push').addEventListener('click', () => doPush(container));
    el.querySelector('#c-msg').addEventListener('keydown', (e) => { if (e.key === 'Enter') doPush(container); });
}

function progress(container) {
    const box = container.querySelector('#c-progress');
    box.hidden = false;
    return (msg, done, total) => {
        box.querySelector('span').textContent = msg;
        box.querySelector('i').style.width = total ? `${Math.round((done / total) * 100)}%` : '100%';
        box.classList.toggle('is-indeterminate', !total);
    };
}

async function doPush(container) {
    const u = ui();
    if (busy) return;
    if (status?.remote) { showToast(u.pullFirst, 'warning', 6000); return; }
    busy = true;
    try {
        const msg = container.querySelector('#c-msg').value.trim();
        const r = await pushProject(msg, progress(container));
        showToast(r.nothing ? u.nothing : fmt(u.pushed, { n: r.changed }), 'success');
    } catch (e) {
        showToast(e.message, 'error', 8000);
    } finally {
        busy = false;
        refreshAll(container);
    }
}

async function doPull(container) {
    const u = ui();
    if (busy) return;
    if (status?.local && status?.lastSync) {
        const ok = await showModal({ title: u.pull, icon: 'arrow-down-to-line', tone: 'warning', size: 'sm', content: `<p>${u.confirmPull}</p>`,
            actions: [{ id: 'no', label: 'Cancel' }, { id: 'yes', label: u.pull, class: 'btn-primary' }] });
        if (ok !== 'yes') return;
    }
    busy = true;
    try {
        const r = await pullProject(progress(container));
        showToast(fmt(u.pulled, { a: r.assets, b: r.audio }), 'success');
    } catch (e) {
        showToast(e.message, 'error', 8000);
    } finally {
        busy = false;
        refreshAll(container);
    }
}

async function loadHistory(container) {
    const u = ui();
    const el = container.querySelector('#c-history');
    if (!el) return;
    let commits = [];
    try { commits = await listCommits(); } catch { /* shown as empty */ }
    if (!commits.length) { el.innerHTML = `<p class="collab-empty">${u.empty}</p>`; return; }
    el.innerHTML = commits.map((c, i) => `
      <div class="collab-commit ${c.sha === status?.lastSync?.sha ? 'is-synced' : ''}">
        ${c.avatar ? `<img src="${escapeHtml(c.avatar)}&s=48" alt="" />` : `<span class="collab-dot"></span>`}
        <div class="collab-commit-main"><b>${escapeHtml(c.message)}</b>
          <small>${escapeHtml(c.author)} · ${new Date(c.date).toLocaleString()} · <code>${c.sha.slice(0, 7)}</code></small></div>
        <div class="collab-commit-act">
          <a class="btn btn-ghost btn-sm btn-icon" href="${escapeHtml(c.url)}" target="_blank" rel="noopener" title="${u.open}">${getIcon('external-link', 'w-3.5 h-3.5')}</a>
          ${i > 0 ? `<button class="btn btn-ghost btn-sm" data-restore="${c.sha}">${getIcon('rotate-ccw', 'w-3.5 h-3.5')} ${u.restore}</button>` : ''}
        </div>
      </div>`).join('');
    el.querySelectorAll('[data-restore]').forEach(b => b.addEventListener('click', async () => {
        const ok = await showModal({ title: u.restore, icon: 'rotate-ccw', tone: 'warning', size: 'sm', content: `<p>${u.confirmRestore}</p>`,
            actions: [{ id: 'no', label: 'Cancel' }, { id: 'yes', label: u.restore, class: 'btn-primary' }] });
        if (ok !== 'yes') return;
        try {
            const r = await pullProject(progress(container), undefined, b.dataset.restore);
            showToast(fmt(u.pulled, { a: r.assets, b: r.audio }), 'success');
        } catch (e) { showToast(e.message, 'error'); }
        refreshAll(container);
    }));
}

async function loadNotesList(container) {
    const u = ui();
    const cfg = loadCollabConfig();
    const el = container.querySelector('#c-notes');
    if (!el) return;
    const notes = await listNotes(cfg.pat, cfg.repo);
    el.innerHTML = notes.length ? notes.slice(0, 20).map(n => `
      <div class="collab-note"><b>${escapeHtml(n.author)}</b> <small>${new Date(n.date).toLocaleString()}</small><p>${escapeHtml(n.text)}</p></div>`).join('')
        : `<p class="collab-empty">${u.empty}</p>`;
}
