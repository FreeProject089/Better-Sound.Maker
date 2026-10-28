/**
 * help-content.js — Text of the in-app Documentation and F.A.Q pages (EN/FR)
 *
 * Articles are short and task-shaped; each links to the matching page of the
 * full docs site (DOCS_SITE + path) for the long version. Keep the facts in
 * sync with docs/ (the site is the reference).
 *
 * Article body helpers: steps → numbered list, note/tip/warn → callouts,
 * `go` → button that opens an app page.
 */

export const DOCS_SITE = 'https://freeproject089.github.io/Better-Sound.Maker/';

export const DOC_SECTIONS = [
    { id: 'start', icon: 'rocket', title: { en: 'Getting started', fr: 'Premiers pas' } },
    { id: 'workflow', icon: 'route', title: { en: 'The workflow', fr: 'Le parcours' } },
    { id: 'reference', icon: 'book-marked', title: { en: 'Reference', fr: 'Référence' } },
    { id: 'help', icon: 'life-buoy', title: { en: 'Help', fr: 'Aide' } },
];

export const DOC_ARTICLES = [
    {
        id: 'what', section: 'start', icon: 'sparkles', site: 'getting-started/dcs-sound-mods/',
        title: { en: 'How a DCS sound mod works', fr: 'Comment marche un mod son DCS' },
        summary: { en: 'SDEF files, wave paths and why names matter.', fr: 'Fichiers SDEF, chemins wave et pourquoi les noms comptent.' },
        body: {
            en: `<p>DCS never plays an audio file directly. It plays a <b>sound definition</b> (<code>.sdef</code>): a small Lua-like file that says <i>which</i> audio to play and <i>how</i> (volume, pitch, distance, cone, loop).</p>
<p>A sound mod is a folder with SDEFs carrying <b>the same relative names</b> as the game's own, plus your audio. DCS loads your SDEF instead of the original and your sound plays.</p>
<table class="help-table"><tr><th>In the mod</th><th>Role</th></tr>
<tr><td><code>entry.lua</code></td><td>declares the mod and mounts its <code>Sounds</code> folder</td></tr>
<tr><td><code>Sounds/sdef/…/Engine.sdef</code></td><td>replaces the game's SDEF of the same path</td></tr>
<tr><td><code>Sounds/Effects/…/engine.wav</code></td><td>your audio, pointed to by <code>wave = "…"</code></td></tr></table>
<p class="help-note"><b>wave</b> paths are relative to <code>Sounds/</code>. Without an extension DCS tries <code>.wav</code>, then <code>.ogg</code>. Samples are mono or stereo.</p>`,
            fr: `<p>DCS ne joue jamais un fichier audio directement. Il joue une <b>définition de son</b> (<code>.sdef</code>) : un petit fichier proche du Lua qui dit <i>quel</i> audio jouer et <i>comment</i> (volume, hauteur, distance, cône, boucle).</p>
<p>Un mod son est un dossier qui contient des SDEF aux <b>mêmes chemins relatifs</b> que ceux du jeu, plus votre audio. DCS charge votre SDEF à la place de l'original et votre son est joué.</p>
<table class="help-table"><tr><th>Dans le mod</th><th>Rôle</th></tr>
<tr><td><code>entry.lua</code></td><td>déclare le mod et monte son dossier <code>Sounds</code></td></tr>
<tr><td><code>Sounds/sdef/…/Engine.sdef</code></td><td>remplace le SDEF du jeu au même chemin</td></tr>
<tr><td><code>Sounds/Effects/…/engine.wav</code></td><td>votre audio, désigné par <code>wave = "…"</code></td></tr></table>
<p class="help-note">Les chemins <b>wave</b> sont relatifs à <code>Sounds/</code>. Sans extension, DCS essaie <code>.wav</code> puis <code>.ogg</code>. Les échantillons sont mono ou stéréo.</p>`,
        },
    },
    {
        id: 'setup', section: 'start', icon: 'folder-cog', site: 'getting-started/first-launch/', go: 'settings',
        title: { en: 'Set up your DCS folders', fr: 'Configurer vos dossiers DCS' },
        summary: { en: 'Point BSM at DCS and scan the sound list.', fr: 'Indiquer DCS à BSM et analyser la liste des sons.' },
        body: {
            en: `<ol><li>Open <b>Settings</b> and set the DCS installation folder (e.g. <code>C:\\Program Files\\Eagle Dynamics\\DCS World</code>).</li>
<li>Go to the <b>Assets Library</b>. The first time, the scanner asks for the DCS and (optional) Saved Games folders.</li>
<li>Press <b>Start Scan</b>. BSM reads <code>Doc/Sounds/sdef_and_wave_list.txt</code>, then your <code>CoreMods</code> and installed mods.</li></ol>
<p class="help-tip">Turn on <b>Auto-scan</b> in Settings to refresh the library at every start, for example after a DCS update.</p>`,
            fr: `<ol><li>Ouvrez <b>Paramètres</b> et indiquez le dossier d'installation de DCS (ex. <code>C:\\Program Files\\Eagle Dynamics\\DCS World</code>).</li>
<li>Allez dans la <b>Bibliothèque</b>. La première fois, l'analyseur demande les dossiers DCS et (facultatif) Saved Games.</li>
<li>Appuyez sur <b>Lancer l'analyse</b>. BSM lit <code>Doc/Sounds/sdef_and_wave_list.txt</code>, puis vos <code>CoreMods</code> et mods installés.</li></ol>
<p class="help-tip">Activez l'<b>analyse automatique</b> dans Paramètres pour rafraîchir la bibliothèque à chaque démarrage, par exemple après une mise à jour de DCS.</p>`,
        },
    },
    {
        id: 'first-mod', section: 'workflow', icon: 'list-checks', site: 'guide/first-mod/', go: 'library',
        title: { en: 'Your first mod, step by step', fr: 'Votre premier mod, pas à pas' },
        summary: { en: 'From picking sounds to a folder ready for DCS.', fr: 'Du choix des sons au dossier prêt pour DCS.' },
        body: {
            en: `<ol><li><b>Library</b>: search or browse, tick the sounds to replace.</li>
<li><b>Projects</b>: drop a <code>.wav</code>/<code>.ogg</code> on each sound, press Play to check it.</li>
<li><b>SDEF editor</b> (optional): adjust gain, distance, loop… and <b>Save</b>.</li>
<li><b>Mod Generator</b>: fill in the name and author, choose the audio format, press <b>Build</b>.</li>
<li>Copy the mod folder to <code>Saved Games\\DCS\\Mods\\resource</code>, start DCS.</li></ol>
<p class="help-warn">Unsaved SDEF edits are not built: the Build page offers <b>Save All</b> first.</p>`,
            fr: `<ol><li><b>Bibliothèque</b> : cherchez ou parcourez, cochez les sons à remplacer.</li>
<li><b>Projets</b> : déposez un <code>.wav</code>/<code>.ogg</code> sur chaque son, appuyez sur Lecture pour vérifier.</li>
<li><b>Éditeur SDEF</b> (facultatif) : réglez gain, distance, boucle… puis <b>Enregistrer</b>.</li>
<li><b>Générateur de mod</b> : nom et auteur, format audio, puis <b>Construire</b>.</li>
<li>Copiez le dossier du mod dans <code>Saved Games\\DCS\\Mods\\resource</code>, lancez DCS.</li></ol>
<p class="help-warn">Les modifications SDEF non enregistrées ne sont pas construites : la page de construction propose d'abord <b>Tout enregistrer</b>.</p>`,
        },
    },
    {
        id: 'audio', section: 'workflow', icon: 'audio-waveform', site: 'features/project/',
        title: { en: 'Preparing your audio', fr: 'Préparer votre audio' },
        summary: { en: 'Formats, mono vs stereo, loops and levels.', fr: 'Formats, mono ou stéréo, boucles et niveaux.' },
        body: {
            en: `<ul><li><b>Format</b>: <code>.wav</code> (16-bit PCM is safest) or <code>.ogg</code> Vorbis. The build can convert everything to WAV or to real OGG.</li>
<li><b>Mono</b> for anything placed in the world (engines, guns, switches): DCS positions it in 3D. <b>Stereo</b> for cockpit ambience and music.</li>
<li><b>Loops</b> (engines, wind): cut on a zero crossing and make the end match the start, or you will hear a click.</li>
<li><b>Level</b>: normalise around -3 dBFS and tune loudness with the SDEF <code>gain</code> rather than by clipping the file.</li>
<li><b>Several files</b> for one SDEF: each wave gets its own drop zone; <code>listmode</code> decides random, sequence or attack-then-loop.</li></ul>`,
            fr: `<ul><li><b>Format</b> : <code>.wav</code> (PCM 16 bits, le plus sûr) ou <code>.ogg</code> Vorbis. La construction peut tout convertir en WAV ou en vrai OGG.</li>
<li><b>Mono</b> pour tout ce qui est placé dans le monde (moteurs, canons, interrupteurs) : DCS le positionne en 3D. <b>Stéréo</b> pour l'ambiance cockpit et la musique.</li>
<li><b>Boucles</b> (moteurs, vent) : coupez sur un passage à zéro et faites correspondre la fin au début, sinon un clic s'entend.</li>
<li><b>Niveau</b> : normalisez vers -3 dBFS et réglez le volume avec le <code>gain</code> du SDEF plutôt qu'en saturant le fichier.</li>
<li><b>Plusieurs fichiers</b> pour un SDEF : chaque wave a sa zone de dépôt ; <code>listmode</code> choisit aléatoire, séquence ou attaque puis boucle.</li></ul>`,
        },
    },
    {
        id: 'sdef-editor', section: 'workflow', icon: 'sliders-horizontal', site: 'features/sdef-editor/', go: 'sdef-editor',
        title: { en: 'Tuning a sound in the SDEF editor', fr: 'Régler un son dans l\'éditeur SDEF' },
        summary: { en: 'Visual and raw modes, the checker and the curve.', fr: 'Modes visuel et texte, le vérificateur et la courbe.' },
        body: {
            en: `<p>Pick a file in the tree. <b>Visual</b> shows every parameter by group with steppers; <b>Raw</b> is the text, edited as is. Both stay in sync.</p>
<ul><li>The <b>checker</b> above the editor flags mistakes live (radius order, typos like <code>ptich</code>, cone without direction…). Click a problem to jump to the field.</li>
<li>The <b>attenuation curve</b> (Radius group) shows how loud the sound is at each distance.</li>
<li>Parameters with an <b>ED</b> badge are used in Eagle Dynamics' own files but missing from their example.</li>
<li><b>Templates</b> save a set of values to apply to one or all SDEFs; each keeps its own <code>wave</code>.</li></ul>`,
            fr: `<p>Choisissez un fichier dans l'arborescence. <b>Visuel</b> montre chaque paramètre par groupe ; <b>Texte</b> est le contenu brut, modifié tel quel. Les deux restent synchronisés.</p>
<ul><li>Le <b>vérificateur</b> au-dessus de l'éditeur signale les erreurs en direct (ordre des rayons, fautes comme <code>ptich</code>, cône sans direction…). Cliquez sur un problème pour aller au champ.</li>
<li>La <b>courbe d'atténuation</b> (groupe Rayon) montre le volume selon la distance.</li>
<li>Les paramètres avec un badge <b>ED</b> sont utilisés dans les fichiers d'Eagle Dynamics mais absents de leur exemple.</li>
<li>Les <b>templates</b> enregistrent des valeurs à appliquer à un ou tous les SDEF ; chacun garde son <code>wave</code>.</li></ul>`,
        },
    },
    {
        id: 'build', section: 'workflow', icon: 'package-check', site: 'features/build/', go: 'build',
        title: { en: 'Building and installing the mod', fr: 'Construire et installer le mod' },
        summary: { en: 'Output layout, audio formats, where to copy it.', fr: 'Structure produite, formats audio, où la copier.' },
        body: {
            en: `<p>The desktop app writes a folder; in a browser, Chrome/Edge write a folder and others download a <code>.zip</code>.</p>
<table class="help-table"><tr><th>Audio format</th><th>Result</th></tr>
<tr><td>Keep original</td><td>files copied as they are</td></tr>
<tr><td>WAV</td><td>everything decoded and written as 16-bit WAV</td></tr>
<tr><td>OGG</td><td>real Ogg Vorbis (desktop app); WAV in a browser</td></tr></table>
<p>Install: copy the folder to <code>%USERPROFILE%\\Saved Games\\DCS\\Mods\\resource</code> (create <code>resource</code> if needed), or use a mod manager such as Better Mods Manager.</p>`,
            fr: `<p>L'application de bureau écrit un dossier ; dans un navigateur, Chrome/Edge écrivent un dossier et les autres téléchargent un <code>.zip</code>.</p>
<table class="help-table"><tr><th>Format audio</th><th>Résultat</th></tr>
<tr><td>Garder l'original</td><td>fichiers copiés tels quels</td></tr>
<tr><td>WAV</td><td>tout est décodé et écrit en WAV 16 bits</td></tr>
<tr><td>OGG</td><td>vrai Ogg Vorbis (application de bureau) ; WAV dans un navigateur</td></tr></table>
<p>Installation : copiez le dossier dans <code>%USERPROFILE%\\Saved Games\\DCS\\Mods\\resource</code> (créez <code>resource</code> si besoin), ou utilisez un gestionnaire de mods comme Better Mods Manager.</p>`,
        },
    },
    {
        id: 'presets', section: 'workflow', icon: 'bookmark', site: 'features/presets/', go: 'presets',
        title: { en: 'Presets and the community catalog', fr: 'Presets et catalogue communautaire' },
        summary: { en: 'Save, share and update selections of sounds.', fr: 'Enregistrer, partager et mettre à jour des sélections.' },
        body: {
            en: `<ul><li><b>Save Current Selection</b> stores the ticked sounds as a preset; <b>Apply</b> ticks them again in any project.</li>
<li><b>Export</b> writes a JSON file to share; raise its <b>update number</b> each time you publish a change.</li>
<li><b>Community Presets</b> lists the catalog; installed presets show <b>Update Available</b> when a newer one is published.</li>
<li>Use your own catalog: <i>Settings → Community catalog</i>, then <b>Test</b>.</li></ul>`,
            fr: `<ul><li><b>Enregistrer la sélection</b> garde les sons cochés en preset ; <b>Appliquer</b> les recoche dans n'importe quel projet.</li>
<li><b>Exporter</b> écrit un fichier JSON à partager ; augmentez son <b>numéro de mise à jour</b> à chaque publication.</li>
<li><b>Presets communautaires</b> liste le catalogue ; un preset installé affiche <b>Mise à jour disponible</b> quand une version plus récente est publiée.</li>
<li>Votre propre catalogue : <i>Paramètres → Catalogue communautaire</i>, puis <b>Tester</b>.</li></ul>`,
        },
    },
    { id: 'params', section: 'reference', icon: 'table-2', site: 'reference/sdef-parameters/', generated: 'params',
        title: { en: 'SDEF parameters', fr: 'Paramètres SDEF' },
        summary: { en: 'Every parameter, its default and meaning.', fr: 'Chaque paramètre, sa valeur par défaut et son rôle.' } },
    { id: 'types', section: 'reference', icon: 'tags', site: 'features/sound-types/', generated: 'types', go: 'custom-types',
        title: { en: 'Sound types', fr: 'Types de sons' },
        summary: { en: 'The categories BSM detects from a path.', fr: 'Les catégories que BSM détecte d\'après un chemin.' } },
    {
        id: 'radius', section: 'reference', icon: 'radar', site: 'how-it-works/sdef-model/',
        title: { en: 'Distance and the radius curve', fr: 'Distance et courbe des rayons' },
        summary: { en: 'silent, peak, inner and outer radius explained.', fr: 'Les rayons silent, peak, inner et outer expliqués.' },
        body: {
            en: `<table class="help-table"><tr><th>Radius</th><th>Gain there</th></tr>
<tr><td><code>silent_radius</code></td><td>0 inside it (rises linearly to the peak)</td></tr>
<tr><td><code>peak_radius</code></td><td>maximum (1.0 × gain)</td></tr>
<tr><td><code>inner_radius</code></td><td>0.85 × gain, the "reference distance"</td></tr>
<tr><td><code>outer_radius</code></td><td>0 beyond it</td></tr></table>
<p>Between inner and half of outer, gain falls with inverse distance, then linearly to 0. If only one of inner/outer is set, DCS derives the other (outer = inner / 0.001).</p>
<p class="help-tip">Radii must grow outward: silent ≤ peak ≤ inner ≤ outer. The checker in the SDEF editor tells you when they don't.</p>`,
            fr: `<table class="help-table"><tr><th>Rayon</th><th>Gain à cet endroit</th></tr>
<tr><td><code>silent_radius</code></td><td>0 à l'intérieur (monte linéairement jusqu'au pic)</td></tr>
<tr><td><code>peak_radius</code></td><td>maximum (1,0 × gain)</td></tr>
<tr><td><code>inner_radius</code></td><td>0,85 × gain, la « distance de référence »</td></tr>
<tr><td><code>outer_radius</code></td><td>0 au-delà</td></tr></table>
<p>Entre inner et la moitié d'outer, le gain baisse en inverse de la distance, puis linéairement jusqu'à 0. Si un seul des deux (inner/outer) est défini, DCS déduit l'autre (outer = inner / 0,001).</p>
<p class="help-tip">Les rayons doivent croître vers l'extérieur : silent ≤ peak ≤ inner ≤ outer. Le vérificateur de l'éditeur SDEF vous prévient sinon.</p>`,
        },
    },
    {
        id: 'shortcuts', section: 'reference', icon: 'keyboard', site: 'reference/crash-logs/',
        title: { en: 'Keyboard shortcuts', fr: 'Raccourcis clavier' },
        summary: { en: 'The keys that work everywhere.', fr: 'Les touches qui marchent partout.' },
        body: {
            en: `<table class="help-table"><tr><th>Keys</th><th>Action</th></tr>
<tr><td><kbd>Ctrl</kbd> <kbd>K</kbd></td><td>Command palette: jump to any page or action</td></tr>
<tr><td><kbd>Ctrl</kbd> <kbd>Z</kbd> / <kbd>Ctrl</kbd> <kbd>Y</kbd></td><td>Undo / redo (selection, SDEFs, project, presets)</td></tr>
<tr><td><kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>L</kbd></td><td>Generate a crash log</td></tr>
<tr><td><kbd>Space</kbd> · <kbd>A</kbd> / <kbd>B</kbd></td><td>In the Listen window: play/stop, switch yours / original</td></tr>
<tr><td><kbd>Esc</kbd></td><td>Close a dialog or the tour</td></tr>
<tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Previous / next step of the tour</td></tr></table>`,
            fr: `<table class="help-table"><tr><th>Touches</th><th>Action</th></tr>
<tr><td><kbd>Ctrl</kbd> <kbd>K</kbd></td><td>Palette de commandes : aller à une page ou une action</td></tr>
<tr><td><kbd>Ctrl</kbd> <kbd>Z</kbd> / <kbd>Ctrl</kbd> <kbd>Y</kbd></td><td>Annuler / rétablir (sélection, SDEF, projet, presets)</td></tr>
<tr><td><kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>L</kbd></td><td>Générer un crash log</td></tr>
<tr><td><kbd>Espace</kbd> · <kbd>A</kbd> / <kbd>B</kbd></td><td>Dans la fenêtre Écouter : lire/arrêter, basculer le vôtre / l'original</td></tr>
<tr><td><kbd>Échap</kbd></td><td>Fermer une fenêtre ou la visite</td></tr>
<tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Étape précédente / suivante de la visite</td></tr></table>`,
        },
    },
    {
        id: 'trouble', section: 'help', icon: 'wrench', site: 'reference/troubleshooting/',
        title: { en: 'Troubleshooting', fr: 'Dépannage' },
        summary: { en: 'The usual problems and their fix.', fr: 'Les problèmes courants et leur solution.' },
        body: {
            en: `<table class="help-table"><tr><th>Problem</th><th>Fix</th></tr>
<tr><td>The library is empty</td><td>Set the DCS folder in Settings, then <b>Reload Library</b>.</td></tr>
<tr><td>My sound doesn't play in DCS</td><td>Check the mod is in <code>Mods\\resource</code>, the SDEF path matches the game's, and the checker shows no error.</td></tr>
<tr><td>It's too quiet far away</td><td>Raise <code>inner_radius</code>/<code>outer_radius</code>, not only <code>gain</code>.</td></tr>
<tr><td>A click at each loop</td><td>Cut the file on a zero crossing; use <code>listmode = ASR</code> for start-then-loop.</td></tr>
<tr><td>I chose OGG and got WAV</td><td>OGG encoding needs the desktop app.</td></tr>
<tr><td>Community presets don't load</td><td>BSM uses its offline copy; test the catalog URL in Settings.</td></tr></table>`,
            fr: `<table class="help-table"><tr><th>Problème</th><th>Solution</th></tr>
<tr><td>La bibliothèque est vide</td><td>Indiquez le dossier DCS dans Paramètres, puis <b>Recharger la bibliothèque</b>.</td></tr>
<tr><td>Mon son n'est pas joué dans DCS</td><td>Vérifiez que le mod est dans <code>Mods\\resource</code>, que le chemin du SDEF correspond à celui du jeu, et que le vérificateur n'affiche aucune erreur.</td></tr>
<tr><td>Trop faible de loin</td><td>Augmentez <code>inner_radius</code>/<code>outer_radius</code>, pas seulement <code>gain</code>.</td></tr>
<tr><td>Un clic à chaque boucle</td><td>Coupez le fichier sur un passage à zéro ; <code>listmode = ASR</code> pour début puis boucle.</td></tr>
<tr><td>J'ai choisi OGG et j'ai du WAV</td><td>L'encodage OGG nécessite l'application de bureau.</td></tr>
<tr><td>Les presets communautaires ne chargent pas</td><td>BSM utilise sa copie hors ligne ; testez l'URL du catalogue dans Paramètres.</td></tr></table>`,
        },
    },
    {
        id: 'crash', section: 'help', icon: 'bug', site: 'reference/crash-logs/', action: 'crash',
        title: { en: 'Reporting a bug', fr: 'Signaler un bug' },
        summary: { en: 'Generate a crash log and where to send it.', fr: 'Générer un crash log et où l\'envoyer.' },
        body: {
            en: `<ol><li>Press <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>L</kbd> (or the bug button in the sidebar).</li>
<li>Describe what you were doing, then <b>Generate</b> (or <b>Copy</b>).</li>
<li>Open an issue on GitHub and attach the file.</li></ol>
<p class="help-note">The log contains no secret: tokens are masked and your user folder is shortened to <code>~</code>.</p>`,
            fr: `<ol><li>Appuyez sur <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>L</kbd> (ou le bouton bug de la barre latérale).</li>
<li>Décrivez ce que vous faisiez, puis <b>Générer</b> (ou <b>Copier</b>).</li>
<li>Ouvrez une issue sur GitHub et joignez le fichier.</li></ol>
<p class="help-note">Le log ne contient aucun secret : les jetons sont masqués et votre dossier utilisateur est raccourci en <code>~</code>.</p>`,
        },
    },
];

/* ── F.A.Q ─────────────────────────────────────────────────────────── */

export const FAQ_CATEGORIES = [
    { id: 'basics', icon: 'circle-help', title: { en: 'Basics', fr: 'Les bases' } },
    { id: 'audio', icon: 'audio-lines', title: { en: 'Audio & SDEF', fr: 'Audio et SDEF' } },
    { id: 'mods', icon: 'package', title: { en: 'Mods & DCS', fr: 'Mods et DCS' } },
    { id: 'app', icon: 'monitor-cog', title: { en: 'App, updates & data', fr: 'Application, mises à jour et données' } },
];

export const FAQ = [
    { cat: 'basics', q: { en: 'Do I need to know Lua?', fr: 'Faut-il connaître le Lua ?' },
      a: { en: 'No. BSM writes the SDEFs and <code>entry.lua</code> for you. The Raw mode of the SDEF editor is there if you want to see or edit the text.', fr: 'Non. BSM écrit les SDEF et l\'<code>entry.lua</code> pour vous. Le mode Texte de l\'éditeur SDEF est là si vous voulez voir ou modifier le contenu.' } },
    { cat: 'basics', q: { en: 'Is it free? Is it safe for my DCS install?', fr: 'Est-ce gratuit ? Sans risque pour mon DCS ?' },
      a: { en: 'Free and open source (Apache-2.0). BSM only <b>reads</b> your DCS folder; the mod it builds goes to Saved Games, so the game files are never touched and removing the mod folder undoes everything.', fr: 'Gratuit et open source (Apache-2.0). BSM ne fait que <b>lire</b> votre dossier DCS ; le mod construit va dans Saved Games, donc les fichiers du jeu ne sont jamais modifiés et supprimer le dossier du mod annule tout.' } },
    { cat: 'basics', q: { en: 'Where is sdef_and_wave_list.txt?', fr: 'Où se trouve sdef_and_wave_list.txt ?' },
      a: { en: 'In your DCS installation: <code>DCS World\\Doc\\Sounds\\sdef_and_wave_list.txt</code>. It is generated by DCS and lists every sound event. BSM finds it from the DCS folder set in Settings.', fr: 'Dans votre installation DCS : <code>DCS World\\Doc\\Sounds\\sdef_and_wave_list.txt</code>. DCS le génère et il liste tous les événements sonores. BSM le trouve grâce au dossier DCS indiqué dans Paramètres.' }, go: 'settings' },
    { cat: 'basics', q: { en: 'How do I find the sound I want to replace?', fr: 'Comment trouver le son à remplacer ?' },
      a: { en: 'Search the Library by aircraft or keyword (<code>F-16</code>, <code>afterburner</code>, <code>canopy</code>), filter by sound type, and check the wave column: it shows which audio file the game uses today.', fr: 'Cherchez dans la Bibliothèque par appareil ou mot-clé (<code>F-16</code>, <code>afterburner</code>, <code>canopy</code>), filtrez par type de son, et regardez la colonne wave : elle indique le fichier audio utilisé aujourd\'hui par le jeu.' }, go: 'library' },
    { cat: 'basics', q: { en: 'Can I edit an existing mod?', fr: 'Puis-je modifier un mod existant ?' },
      a: { en: 'Yes: <b>Projects → Load Existing Mod</b> imports a mod <code>.zip</code>, its SDEFs and the audio it can match.', fr: 'Oui : <b>Projets → Charger un mod existant</b> importe un <code>.zip</code> de mod, ses SDEF et l\'audio qu\'il arrive à associer.' }, go: 'project' },

    { cat: 'audio', q: { en: 'WAV or OGG?', fr: 'WAV ou OGG ?' },
      a: { en: 'Both work. WAV loads fastest and is lossless; OGG makes a much smaller mod. Build with <b>OGG</b> in the desktop app to convert everything for you.', fr: 'Les deux marchent. Le WAV se charge le plus vite et sans perte ; l\'OGG donne un mod bien plus léger. Construisez en <b>OGG</b> dans l\'application de bureau pour tout convertir.' } },
    { cat: 'audio', q: { en: 'Mono or stereo?', fr: 'Mono ou stéréo ?' },
      a: { en: 'Mono for anything in the 3D world (engines, weapons, switches): DCS places it around you. Stereo is fine for cockpit ambience, radios and music.', fr: 'Mono pour tout ce qui est dans le monde 3D (moteurs, armes, interrupteurs) : DCS le place autour de vous. La stéréo convient à l\'ambiance cockpit, aux radios et à la musique.' } },
    { cat: 'audio', q: { en: 'My sound is too quiet / too loud.', fr: 'Mon son est trop faible / trop fort.' },
      a: { en: 'Change <code>gain</code> in the SDEF editor (1.0 = unchanged). If it fades too early with distance, raise <code>inner_radius</code> and <code>outer_radius</code>; the curve shows the result.', fr: 'Modifiez <code>gain</code> dans l\'éditeur SDEF (1,0 = inchangé). S\'il s\'éteint trop tôt avec la distance, augmentez <code>inner_radius</code> et <code>outer_radius</code> ; la courbe montre le résultat.' }, go: 'sdef-editor' },
    { cat: 'audio', q: { en: 'How do I make an engine loop seamlessly?', fr: 'Comment faire boucler un moteur sans coupure ?' },
      a: { en: 'Cut the file on a zero crossing so the end matches the start. For a start sound followed by a loop, give the SDEF two waves and set <code>listmode = ASR</code>.', fr: 'Coupez le fichier sur un passage à zéro pour que la fin rejoigne le début. Pour un son de démarrage suivi d\'une boucle, donnez deux waves au SDEF et réglez <code>listmode = ASR</code>.' } },
    { cat: 'audio', q: { en: 'Can one SDEF play random variations?', fr: 'Un SDEF peut-il jouer des variantes au hasard ?' },
      a: { en: 'Yes. Give it several waves (one drop zone each); with <code>listmode = RANDOM</code> DCS picks one per playback. <code>gain_random</code> and <code>pitch_random</code> add small variations too.', fr: 'Oui. Donnez-lui plusieurs waves (une zone de dépôt chacune) ; avec <code>listmode = RANDOM</code>, DCS en choisit une à chaque lecture. <code>gain_random</code> et <code>pitch_random</code> ajoutent aussi de petites variations.' } },
    { cat: 'audio', q: { en: 'What does the ED badge mean?', fr: 'Que veut dire le badge ED ?' },
      a: { en: 'The parameter is used in Eagle Dynamics\' own SDEF files but is not in their documented example. BSM only writes it when you set it.', fr: 'Le paramètre est utilisé dans les fichiers SDEF d\'Eagle Dynamics mais absent de leur exemple documenté. BSM ne l\'écrit que si vous le remplissez.' } },

    { cat: 'mods', q: { en: 'Where do I put the built mod?', fr: 'Où mettre le mod construit ?' },
      a: { en: 'In <code>%USERPROFILE%\\Saved Games\\DCS\\Mods\\resource</code> (create the <code>resource</code> folder if it doesn\'t exist), then restart DCS.', fr: 'Dans <code>%USERPROFILE%\\Saved Games\\DCS\\Mods\\resource</code> (créez le dossier <code>resource</code> s\'il n\'existe pas), puis redémarrez DCS.' } },
    { cat: 'mods', q: { en: 'My mod doesn\'t change anything in game.', fr: 'Mon mod ne change rien en jeu.' },
      a: { en: 'Check that the folder holding <code>entry.lua</code> is directly inside <code>Mods\\resource</code>, that the SDEF paths match the game\'s (don\'t rename them), and that the SDEF editor shows no error. DCS logs mod loading in <code>Saved Games\\DCS\\Logs\\dcs.log</code>.', fr: 'Vérifiez que le dossier qui contient <code>entry.lua</code> est directement dans <code>Mods\\resource</code>, que les chemins des SDEF correspondent à ceux du jeu (ne les renommez pas), et que l\'éditeur SDEF n\'affiche aucune erreur. DCS journalise le chargement des mods dans <code>Saved Games\\DCS\\Logs\\dcs.log</code>.' } },
    { cat: 'mods', q: { en: 'Does it work in multiplayer / pass integrity check?', fr: 'Ça marche en multijoueur / passe le contrôle d\'intégrité ?' },
      a: { en: 'Sound mods are client-side and only change what you hear. Servers with a strict integrity check may still refuse modified resources: ask the server admin.', fr: 'Les mods son sont côté client et ne changent que ce que vous entendez. Les serveurs avec un contrôle d\'intégrité strict peuvent quand même refuser des ressources modifiées : demandez à l\'administrateur.' } },
    { cat: 'mods', q: { en: 'Will a DCS update break my mod?', fr: 'Une mise à jour de DCS va-t-elle casser mon mod ?' },
      a: { en: 'Usually not. If ED renames or moves sounds, rescan the library (<b>Reload Library</b>) and check the affected SDEFs.', fr: 'En général non. Si ED renomme ou déplace des sons, relancez l\'analyse (<b>Recharger la bibliothèque</b>) et vérifiez les SDEF concernés.' }, go: 'library' },
    { cat: 'mods', q: { en: 'Can I add custom textures to the mission editor?', fr: 'Puis-je ajouter des images à l\'éditeur de mission ?' },
      a: { en: 'Yes, the <b>Theme</b> page adds loading screens and backgrounds; enable it there and BSM writes the <code>Theme</code> folder and the <code>entry.lua</code> lines.', fr: 'Oui, la page <b>Thème</b> ajoute écrans de chargement et fonds ; activez-la et BSM écrit le dossier <code>Theme</code> et les lignes de l\'<code>entry.lua</code>.' }, go: 'theme' },
    { cat: 'mods', q: { en: 'How do I share presets with others?', fr: 'Comment partager des presets ?' },
      a: { en: 'Export the preset as JSON and send it, or publish it in the community catalog repository so everyone gets it (and its updates) from <b>Community Presets</b>.', fr: 'Exportez le preset en JSON et envoyez-le, ou publiez-le dans le dépôt du catalogue communautaire pour que tout le monde le reçoive (avec ses mises à jour) depuis <b>Presets communautaires</b>.' }, go: 'presets' },

    { cat: 'app', q: { en: 'How do updates work?', fr: 'Comment fonctionnent les mises à jour ?' },
      a: { en: 'BSM checks at start. Installed with BetterInstaller, it updates through it (signed, with rollback); NSIS/MSI installs use the built-in updater. Use <b>Check for updates</b> at the bottom of the sidebar any time.', fr: 'BSM vérifie au démarrage. Installé avec BetterInstaller, il se met à jour par lui (signé, avec retour arrière) ; les installations NSIS/MSI utilisent l\'updater intégré. <b>Vérifier les mises à jour</b>, en bas de la barre latérale, à tout moment.' } },
    { cat: 'app', q: { en: 'Where are my projects saved?', fr: 'Où sont enregistrés mes projets ?' },
      a: { en: 'In the app\'s local storage on this computer, saved as you work. The desktop app remembers the audio files by path and reloads them at start.', fr: 'Dans le stockage local de l\'application sur cet ordinateur, au fil du travail. L\'application de bureau retient les fichiers audio par leur chemin et les recharge au démarrage.' } },
    { cat: 'app', q: { en: 'Desktop app or web version?', fr: 'Application de bureau ou version web ?' },
      a: { en: 'The desktop app can scan your DCS folder directly, write the mod folder, encode OGG and save crash logs. The web version works in a browser with folder picking or a zip download.', fr: 'L\'application de bureau analyse directement votre dossier DCS, écrit le dossier du mod, encode en OGG et enregistre les crash logs. La version web marche dans un navigateur avec sélection de dossier ou téléchargement en zip.' } },
    { cat: 'app', q: { en: 'Something crashed. What should I send?', fr: 'Quelque chose a planté. Que dois-je envoyer ?' },
      a: { en: 'A crash log: press <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>L</kbd>, describe what you did and attach the file to a GitHub issue. In the desktop app, errors are also saved automatically.', fr: 'Un crash log : appuyez sur <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>L</kbd>, décrivez ce que vous faisiez et joignez le fichier à une issue GitHub. Dans l\'application de bureau, les erreurs sont aussi enregistrées automatiquement.' }, action: 'crash' },
    { cat: 'app', q: { en: 'How do I replay the tutorial?', fr: 'Comment relancer le tutoriel ?' },
      a: { en: 'Click <b>Tutorial</b> in the Help section of the sidebar: Tasky starts the tour again.', fr: 'Cliquez sur <b>Relancer Tuto</b> dans la section Aide de la barre latérale : Tasky relance la visite.' }, action: 'tour' },
];
