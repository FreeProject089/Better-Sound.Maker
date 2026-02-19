/**
 * docs.js — Integrated documentation page
 * Audio Guide, SDEF Guide, Theme Guide
 */

export function renderDocs(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Documentation</h1>
      <p class="page-description">Everything you need to know about creating DCS sound mods.</p>
    </div>
    <div class="tabs" id="docs-tabs">
      <div class="tab active" data-tab="audio">🎵 Audio Guide</div>
      <div class="tab" data-tab="sdef">📄 SDEF Guide</div>
      <div class="tab" data-tab="f18">🦅 F/A-18C Reference</div>
      <div class="tab" data-tab="theme">🎨 Theme Guide</div>
      <div class="tab" data-tab="install">📦 Installation</div>
    </div>
    <div class="docs-content" id="docs-content"></div>
  `;

  showTab('audio');

  document.querySelectorAll('#docs-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#docs-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      showTab(tab.dataset.tab);
    });
  });
}

function showTab(tab) {
  const el = document.getElementById('docs-content');
  if (!el) return;

  switch (tab) {
    case 'audio': el.innerHTML = audioGuide(); break;
    case 'sdef': el.innerHTML = sdefGuide(); break;
    case 'f18': el.innerHTML = f18Reference(); break;
    case 'theme': el.innerHTML = themeGuide(); break;
    case 'install': el.innerHTML = installGuide(); break;
  }
}

function audioGuide() {
  return `
    <h2>🎵 Audio Guide for DCS Sound Modding</h2>

    <h3>Mono vs Stereo</h3>
    <table>
      <tr><th>Feature</th><th>Mono</th><th>Stereo</th></tr>
      <tr><td>Channels</td><td>1 channel</td><td>2 channels (L+R)</td></tr>
      <tr><td>File size</td><td>Smaller</td><td>~2x larger</td></tr>
      <tr><td>3D spatialization</td><td>✅ Full 3D positioning</td><td>❌ Limited — sounds come from center</td></tr>
      <tr><td>Use for</td><td>Engine sounds, cockpit switches, weapons</td><td>Ambient sounds, radio chatter, music</td></tr>
    </table>
    <div class="tip-box">
      <strong>Rule of thumb:</strong> If DCS needs to position the sound in 3D space (engines, switches, weapons), use <strong>Mono</strong>.
      Stereo is primarily for ambient/atmospheric sounds and UI effects.
    </div>

    <h3>Loop vs One-Shot</h3>
    <p>DCS distinguishes between two playback modes:</p>
    <ul>
      <li><strong>Loop:</strong> Sound plays continuously until stopped (engines, APU, wind, avionics hum). These need seamless loop points.</li>
      <li><strong>One-shot:</strong> Sound plays once and stops (button clicks, switch toggles, explosions, weapon launches). Set <code>detached = true</code> in the SDEF.</li>
    </ul>

    <div class="warning-box">
      <strong>Important:</strong> Looping sounds should have clean loop points — avoid clicks or pops at the start/end boundaries. Use a DAW to crossfade the loop points.
    </div>

    <h3>Recommended Durations</h3>
    <table>
      <tr><th>Sound Type</th><th>Duration</th><th>Notes</th></tr>
      <tr><td>Button click / Switch</td><td>0.05 – 0.3s</td><td>Short, punchy, one-shot</td></tr>
      <tr><td>Warning tone / Beep</td><td>0.2 – 1.0s</td><td>May loop if alarm</td></tr>
      <tr><td>Engine loop</td><td>2 – 8s</td><td>Seamless loop — DCS will loop it internally</td></tr>
      <tr><td>Startup sequence</td><td>5 – 30s</td><td>One-shot, plays during engine spool-up</td></tr>
      <tr><td>Explosion / Impact</td><td>0.5 – 3s</td><td>One-shot, <code>detached = true</code></td></tr>
      <tr><td>Ambient</td><td>10 – 60s</td><td>Long loop for atmosphere</td></tr>
      <tr><td>Flyby</td><td>3 – 10s</td><td>One-shot, used for AI aircraft passing</td></tr>
    </table>

    <h3>Sample Rate & Bit Depth</h3>
    <ul>
      <li><strong>Recommended sample rate:</strong> <code>44100 Hz</code> or <code>48000 Hz</code></li>
      <li><strong>Bit depth:</strong> <code>16-bit PCM</code> — DCS loads all audio as 16-bit internally</li>
      <li>Higher sample rates will work but waste memory and may cause issues</li>
    </ul>

    <h3>WAV vs OGG</h3>
    <table>
      <tr><th>Format</th><th>Pros</th><th>Cons</th></tr>
      <tr><td><code>.wav</code></td><td>Uncompressed, highest quality, no decode overhead</td><td>Large file sizes (10–50 MB for long samples)</td></tr>
      <tr><td><code>.ogg</code></td><td>Compressed (~5-10x smaller), good quality, widely supported</td><td>Slight decode CPU cost, lossy compression</td></tr>
    </table>
    <div class="tip-box">
      <strong>Recommendation:</strong> Use <code>.ogg</code> for large files (engines, ambience) to save disk space and memory.
      Use <code>.wav</code> for short, critical sounds (clicks, weapon shots) where quality matters most.
    </div>

    <h3>Mixing Tips</h3>
    <ul>
      <li><strong>Normalization:</strong> Normalize to -1 dB to avoid clipping. DCS handles volume via the <code>gain</code> parameter in SDEF files.</li>
      <li><strong>Avoid clipping:</strong> Never exceed 0 dBFS. Clipped audio sounds distorted in-game.</li>
      <li><strong>Dynamic range:</strong> Leave some headroom — don't compress everything to maximum volume.</li>
      <li><strong>Consistency:</strong> Match the perceived loudness of similar sounds across your mod.</li>
      <li><strong>Background noise:</strong> Remove any background noise or hiss from recordings before exporting.</li>
    </ul>
  `;
}

function sdefGuide() {
  return `
    <h2>📄 SDEF File Guide</h2>

    <h3>What is a .sdef file?</h3>
    <p>A <code>.sdef</code> (Source DEFinition) file tells DCS how to play a sound. It defines which audio file to use, its volume, spatial properties, playback mode, and more.</p>
    <p>SDEF files live in <code>Sounds/sdef/</code> and reference audio files in <code>Sounds/Effects/</code>.</p>

    <h3>How DCS Loads Sounds</h3>
    <p>When DCS needs a sound, it looks for the SDEF file at the specified path. The SDEF tells DCS:</p>
    <ol>
      <li>Which audio file(s) to use (<code>wave</code>)</li>
      <li>How loud to play it (<code>gain</code>)</li>
      <li>Where in 3D space it originates (<code>position</code>, <code>inner_radius</code>, <code>outer_radius</code>)</li>
      <li>How to play it (loop, one-shot, random selection)</li>
    </ol>

    <div class="tip-box">
      <strong>Override priority:</strong> When you mount your mod's Sounds/ directory with <code>mount_vfs_sound_path</code>, your SDEF files take priority over DCS defaults. You only need to include the files you want to change.
    </div>

    <h3>Full Parameter Reference</h3>
    <table>
      <tr><th>Parameter</th><th>Type</th><th>Default</th><th>Description</th></tr>
      <tr><td><code>inherit</code></td><td>string</td><td>""</td><td>Name of another .sdef to inherit settings from</td></tr>
      <tr><td><code>wave</code></td><td>string/list</td><td>"default"</td><td>Path to audio file(s) relative to Sounds/. For random selection, use a list: <code>{"sample1", "sample2"}</code></td></tr>
      <tr><td><code>gain</code></td><td>number</td><td>1.0</td><td>Volume multiplier (linear scale). 0.5 = half volume, 2.0 = double volume</td></tr>
      <tr><td><code>pitch</code></td><td>number</td><td>1.0</td><td>Frequency/playback speed multiplier</td></tr>
      <tr><td><code>lowpass</code></td><td>number</td><td>24000</td><td>Lowpass filter cutoff frequency (Hz)</td></tr>
      <tr><td><code>position</code></td><td>{x,y,z}</td><td>{0,0,0}</td><td>Position relative to host: {forward, up, right} in meters</td></tr>
      <tr><td><code>silent_radius</code></td><td>number</td><td>0</td><td>Inside this distance (meters), sound is silent</td></tr>
      <tr><td><code>peak_radius</code></td><td>number</td><td>0</td><td>Distance where gain is at maximum</td></tr>
      <tr><td><code>inner_radius</code></td><td>number</td><td>1</td><td>Reference distance — gain is 0.85 of maximum here</td></tr>
      <tr><td><code>outer_radius</code></td><td>number</td><td>1000</td><td>Beyond this distance, sound is inaudible</td></tr>
      <tr><td><code>direction</code></td><td>{x,y,z}</td><td>{0,0,0}</td><td>Direction of the sound cone</td></tr>
      <tr><td><code>cone_inner_angle</code></td><td>number</td><td>0</td><td>Half-angle (degrees) where gain is full</td></tr>
      <tr><td><code>cone_outer_angle</code></td><td>number</td><td>0</td><td>Half-angle (degrees) beyond which gain drops to cone_outer_gain</td></tr>
      <tr><td><code>cone_outer_gain</code></td><td>number</td><td>1</td><td>Gain outside the outer cone angle</td></tr>
      <tr><td><code>cone_outer_lowpass</code></td><td>number</td><td>24000</td><td>Filter cutoff outside the cone</td></tr>
      <tr><td><code>detached</code></td><td>bool</td><td>false</td><td>If true, sound always plays fully (for explosions, gunshots)</td></tr>
      <tr><td><code>streaming</code></td><td>bool</td><td>false</td><td>If true, streams from disk instead of loading into memory</td></tr>
      <tr><td><code>listmode</code></td><td>enum</td><td>RANDOM</td><td>RANDOM = pick one, SEQUENCE = play all, ASR = first on start then loop rest</td></tr>
      <tr><td><code>attack</code></td><td>number</td><td>0.0</td><td>Fade-in time in seconds</td></tr>
      <tr><td><code>release</code></td><td>number</td><td>0.0</td><td>Fade-out time in seconds</td></tr>
      <tr><td><code>auto_width</code></td><td>bool</td><td>true</td><td>If false, stereo width doesn't change with distance</td></tr>
      <tr><td><code>nodoppler</code></td><td>bool</td><td>true</td><td>If true, Doppler effect is disabled</td></tr>
      <tr><td><code>distance_filter_offset</code></td><td>number</td><td>0</td><td>Distance at which lowpass filtering begins</td></tr>
    </table>

    <h3>Example: Simple One-Shot Switch</h3>
    <pre>wave = "Effects/Aircrafts/A-10C_2/Cockpit/SW_07_Up"
inner_radius = 50
gain = 1</pre>

    <h3>Example: Random Sample Selection</h3>
    <pre>wave = {
    "Effects/Aircrafts/A-10C_2/Cockpit/SW_01_1",
    "Effects/Aircrafts/A-10C_2/Cockpit/SW_01_2",
    "Effects/Aircrafts/A-10C_2/Cockpit/SW_01_3",
    "Effects/Aircrafts/A-10C_2/Cockpit/SW_01_4",
}
inner_radius = 50
gain = 1</pre>
    <div class="tip-box">
      When using a list of samples, DCS will randomly select one each time the sound plays — great for adding variety to repetitive sounds like switch clicks.
    </div>

    <h3>Example: Engine Loop with Cone</h3>
    <pre>wave = "Effects/Aircrafts/F-16/Engine_L"
gain = 0.9
inner_radius = 30
outer_radius = 8000
direction = {-1, 0, 0}
cone_inner_angle = 45
cone_outer_angle = 90
cone_outer_gain = 0.5
attack = 0.1
release = 0.2</pre>

    <h3>Recommended Defaults per Sound Type</h3>
    <p>The mod creator auto-fills these values when generating new SDEFs based on the detected sound type:</p>
    <table>
      <tr><th>Type</th><th>inner_radius</th><th>outer_radius</th><th>gain</th><th>detached</th><th>Notes</th></tr>
      <tr><td>🎛 Cockpit</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Switches, buttons, knobs, MFD sounds</td></tr>
      <tr><td>✈ Engine</td><td>30</td><td>10000</td><td>0.9</td><td>—</td><td>Engine loops, startup, spooldown</td></tr>
      <tr><td>💥 Weapon</td><td>80</td><td>12000</td><td>1</td><td>true</td><td>Gunfire, missile launch, explosions</td></tr>
      <tr><td>🔔 Warning</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Altitude, bingo, caution tones</td></tr>
      <tr><td>📻 Radio</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Betty voice, radio comms</td></tr>
      <tr><td>🌊 Aero</td><td>20</td><td>5000</td><td>0.8</td><td>—</td><td>Wind, airflow, aerodynamic sounds</td></tr>
      <tr><td>🛬 Gear</td><td>40</td><td>3000</td><td>1</td><td>true</td><td>Landing gear, flaps, speedbrake</td></tr>
      <tr><td>⚡ Systems</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Hydraulics, electrics, fuel pumps</td></tr>
      <tr><td>🌍 Environment</td><td>100</td><td>15000</td><td>0.7</td><td>—</td><td>Rain, thunder, tarmac wind</td></tr>
      <tr><td>🔃 Rotor</td><td>50</td><td>12000</td><td>0.9</td><td>—</td><td>Helicopter rotor/transmission</td></tr>
      <tr><td>🎯 Flyby</td><td>60</td><td>8000</td><td>1</td><td>true</td><td>Aircraft pass-by sounds</td></tr>
      <tr><td>💨 Effects</td><td>40</td><td>3000</td><td>1</td><td>true</td><td>Chaff, flare, sonic boom</td></tr>
      <tr><td>🔧 Ground</td><td>40</td><td>2000</td><td>1</td><td>—</td><td>Ground vehicles, tracks</td></tr>
      <tr><td>🖥 UI</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Menu clicks, interface sounds</td></tr>
      <tr><td>🔊 Generic</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Any other/unknown type</td></tr>
    </table>
    <div class="tip-box">
      <strong>Note:</strong> A "—" means the default of the engine is used (outer_radius defaults to inner_radius / 0.001 = 1000× inner_radius).
      <br>The SDEF Editor and Build process use these smart defaults automatically. You can always override them manually.
    </div>

    <h3>Gain-Distance Model</h3>
    <p>DCS uses a multi-stage gain curve based on distance:</p>
    <pre>origin ── 0.0 (silent_radius) ── ramp up ── 1.0 (peak_radius) ── 0.85 (inner_radius) ── inverse distance falloff ── 0.0 (outer_radius)</pre>
    <ul>
      <li><strong>silent_radius → peak_radius:</strong> Linear ramp 0.0 → 1.0</li>
      <li><strong>peak_radius → inner_radius:</strong> Linear ramp 1.0 → 0.85</li>
      <li><strong>inner_radius → outer_radius/2:</strong> Inverse distance law</li>
      <li><strong>outer_radius/2 → outer_radius:</strong> Linear fade to 0.0</li>
    </ul>
  `;
}

function f18Reference() {
  return `
    <h2>🦅 F/A-18C Complete Sound Reference</h2>
    <p>Based on the BetterHornet mod — every SDEF file and WAV detailed.</p>

    <div class="tip-box">
      <strong>🚨 MONO vs STÉRÉO :</strong><br>
      <strong>MONO (1 Canal) 🟡 :</strong> OBLIGATOIRE pour tout ce qui est <strong>extérieur / 3D</strong>. DCS place le son dans l'espace.<br>
      <strong>STÉRÉO (2 Canaux) 🔴 :</strong> Pour les sons <strong>"Ambiance" / "dans le casque"</strong> (vent, ECS, respiration pilote).
    </div>

    <div class="warning-box">
      <strong>🔄 Durée des Loops :</strong><br>
      <strong>Standard (4-8s) :</strong> Recommandé, évite les problèmes de pitch variable.<br>
      <strong>Pro (30s+) :</strong> Plus réaliste mais le régime moteur doit être parfaitement stable sinon DCS créera des artefacts audibles ("pleurage").
    </div>

    <h3>✈️ Moteurs & APU (Externe) — MONO</h3>
    <table>
      <tr><th>Fichier SDEF</th><th>Description</th><th>Type</th><th>Durée</th></tr>
      <tr><td><code>Afterburner.sdef</code></td><td>Post-Combustion externe</td><td>LOOP</td><td>4-8s</td></tr>
      <tr><td><code>F404GE_RPM1.sdef</code></td><td>Idle / Bas Régime (Rumble)</td><td>LOOP</td><td>4-8s</td></tr>
      <tr><td><code>F404GE_RPM2_Front.sdef</code></td><td>Whine (Sifflement) vue avant</td><td>LOOP</td><td>4-6s</td></tr>
      <tr><td><code>F404GE_RPM2_Side.sdef</code></td><td>Whine vue de côté</td><td>LOOP</td><td>4-6s</td></tr>
      <tr><td><code>F404GE_RPM3_Front.sdef</code></td><td>Whine Haut Régime (Militaire)</td><td>LOOP</td><td>4-6s</td></tr>
      <tr><td><code>F404GE_RPM3_Side.sdef</code></td><td>Souffle haut régime côté</td><td>LOOP</td><td>4-6s</td></tr>
      <tr><td><code>F404GE_Back1/2.sdef</code></td><td>Jet Blast (Echappement)</td><td>LOOP</td><td>6-10s</td></tr>
      <tr><td><code>F404GE_Start.sdef</code></td><td>Séquence démarrage externe</td><td>OneShot</td><td>40s</td></tr>
      <tr><td><code>F404GE_Shutdown.sdef</code></td><td>Séquence extinction</td><td>OneShot</td><td>20s</td></tr>
      <tr><td><code>APU_Main.sdef</code></td><td>Moteur APU externe</td><td>LOOP</td><td>6s</td></tr>
      <tr><td><code>APU_End.sdef</code></td><td>Arrêt APU</td><td>OneShot</td><td>4s</td></tr>
      <tr><td><code>APU_SparkPlugs.sdef</code></td><td>Allumeur APU (Tac-tac-tac)</td><td>LOOP</td><td>1s</td></tr>
    </table>

    <h3>🔊 Sons Distants (Flyby) — MONO</h3>
    <table>
      <tr><th>Fichier SDEF</th><th>Description</th><th>Type</th><th>Durée</th></tr>
      <tr><td><code>Distant_Afterburner.sdef</code></td><td>PC lointaine (tonnerre)</td><td>LOOP</td><td>8s</td></tr>
      <tr><td><code>Distant_Front/Back/Side.sdef</code></td><td>Moteur loin (face/arrière/côté)</td><td>LOOP</td><td>8s</td></tr>
      <tr><td><code>Distant_Flyby_S/B.sdef</code></td><td>Passage rapide ("VZOUUU!")</td><td>OneShot</td><td>10s</td></tr>
      <tr><td><code>Whistle.sdef</code></td><td>Sifflement approche lointaine</td><td>LOOP</td><td>5s</td></tr>
    </table>

    <h3>🎧 Cockpit (Interne) — STÉRÉO</h3>
    <table>
      <tr><th>Fichier SDEF</th><th>Description</th><th>Type</th><th>Durée</th></tr>
      <tr><td><code>Afterburner_In.sdef</code></td><td>PC Interne (vibration siège)</td><td>LOOP</td><td>4s</td></tr>
      <tr><td><code>F404GE_RPM1_In.sdef</code></td><td>Rumble (Sub-Bass < 80Hz)</td><td>LOOP</td><td>4s</td></tr>
      <tr><td><code>F404GE_RPM2_In.sdef</code></td><td>Turbine casque (aigus coupés)</td><td>LOOP</td><td>4s</td></tr>
      <tr><td><code>ECS_In.sdef</code></td><td>Climatisation (Hiss principal)</td><td>LOOP</td><td>6s</td></tr>
      <tr><td><code>Avionics.sdef</code></td><td>Ventilation avionique</td><td>LOOP</td><td>4s</td></tr>
      <tr><td><code>HighSpeedWind_In.sdef</code></td><td>Vent haute vitesse</td><td>LOOP</td><td>4s</td></tr>
      <tr><td><code>GearLockUp_In.sdef</code></td><td>Train verrou (KA-CLUNK lourd)</td><td>OneShot</td><td>1s</td></tr>
    </table>

    <h3>🕹️ Switchs (Sw01-15) — MONO</h3>
    <table>
      <tr><th>Fichier SDEF</th><th>Description</th><th>Type</th><th>Durée</th></tr>
      <tr><td><code>Sw01...Sw15.sdef</code></td><td>Interrupteurs variés (métallique, plastique, clic, clac)</td><td>OneShot</td><td>0.1-0.3s</td></tr>
      <tr><td><code>Sw04_1/2.sdef</code></td><td>Rotacteurs (clic cranté)</td><td>OneShot</td><td>0.1s</td></tr>
      <tr><td><code>Sw05_On/Off.sdef</code></td><td>Gros switchs (Batterie/Générateur)</td><td>OneShot</td><td>0.3s</td></tr>
      <tr><td><code>Throttle_Click.sdef</code></td><td>Butée gaz</td><td>OneShot</td><td>0.2s</td></tr>
      <tr><td><code>Throttle_To_Afterburner.sdef</code></td><td>Cran post-combustion</td><td>OneShot</td><td>0.4s</td></tr>
    </table>

    <h3>🗣️ Betty (Alertes Vocales)</h3>
    <table>
      <tr><th>Fichier SDEF</th><th>Phrase</th><th>Type</th></tr>
      <tr><td><code>altitude.sdef</code></td><td>"Altitude"</td><td>OneShot</td></tr>
      <tr><td><code>bingo.sdef</code></td><td>"Bingo" (carburant retour)</td><td>OneShot</td></tr>
      <tr><td><code>pull up.sdef</code></td><td>"Pull Up!" (urgent)</td><td>OneShot</td></tr>
      <tr><td><code>fuel low.sdef</code></td><td>"Fuel Low"</td><td>OneShot</td></tr>
      <tr><td><code>engine fire left.sdef</code></td><td>"Engine Fire Left"</td><td>OneShot</td></tr>
      <tr><td><code>caution.sdef</code></td><td>Tonalité Caution</td><td>LOOP</td></tr>
    </table>

    <h3>📟 Tones (RWR & Alertes)</h3>
    <table>
      <tr><th>Fichier SDEF</th><th>Description</th><th>Type</th></tr>
      <tr><td><code>MissileAlert.sdef</code></td><td>Alerte RWR Missile</td><td>LOOP</td></tr>
      <tr><td><code>MissileLaunch.sdef</code></td><td>Départ missile RWR</td><td>OneShot</td></tr>
      <tr><td><code>master_caution.sdef</code></td><td>Alerte Master Caution</td><td>OneShot</td></tr>
      <tr><td><code>stall_warning.sdef</code></td><td>Avertisseur décrochage</td><td>LOOP</td></tr>
    </table>

    <h3>🔫 Weapons (Armement) — MONO</h3>
    <table>
      <tr><th>Fichier SDEF</th><th>Description</th><th>Durée</th></tr>
      <tr><td><code>M61Cannon.sdef</code></td><td>Canon M61 Vulcan (BRRRRRT)</td><td>2s (loop)</td></tr>
      <tr><td><code>VulcanCannon/End.sdef</code></td><td>Alias canon externe</td><td>1-2s</td></tr>
      <tr><td><code>MissileLaunch.sdef</code></td><td>Départ missile (WOOSH)</td><td>3s</td></tr>
      <tr><td><code>Flare.sdef</code></td><td>Leurre thermique (Pop)</td><td>0.2s</td></tr>
    </table>

    <h3>💣 Explosions — MONO</h3>
    <table>
      <tr><th>Fichier SDEF</th><th>Description</th><th>Durée</th></tr>
      <tr><td><code>ExplodeHeavy.sdef</code></td><td>Grosse bombe (MK84)</td><td>5s</td></tr>
      <tr><td><code>ExplodeMedium.sdef</code></td><td>Moyenne (MK82)</td><td>4s</td></tr>
      <tr><td><code>ExplodeCluster.sdef</code></td><td>CBU (pop-pop-pop)</td><td>5s</td></tr>
      <tr><td><code>DebrisGround.sdef</code></td><td>Retombées débris</td><td>3s</td></tr>
    </table>

    <h3>🔨 Dégâts & 👤 Personnel</h3>
    <table>
      <tr><th>Fichier SDEF</th><th>Description</th><th>Type</th></tr>
      <tr><td><code>HitIn.sdef</code></td><td>Impact interne (coup de marteau)</td><td>OneShot</td></tr>
      <tr><td><code>BulletHit.sdef</code></td><td>Impact balle (Zing)</td><td>OneShot</td></tr>
      <tr><td><code>GearBreakage.sdef</code></td><td>Train cassé</td><td>OneShot</td></tr>
      <tr><td><code>HeartBeating.sdef</code></td><td>Cœur qui bat (forts G)</td><td>LOOP</td></tr>
      <tr><td><code>WoundedPilot.sdef</code></td><td>Pilote blessé</td><td>OneShot</td></tr>
    </table>

    <h3>🎚 Astuces de Customisation SDEF</h3>
    <div class="tip-box">
      <strong>🔊 Moteurs (plus "Gras" ou "Aigu") :</strong><br>
      <code>pitch = 0.9</code> → Plus grave/lent (Rumble profond)<br>
      <code>pitch = 1.1</code> → Plus aigu/rapide (Turbine stridente)<br>
      <code>gain = 2.0</code> → Double le volume (⚠ saturation!)
    </div>
    <div class="tip-box">
      <strong>🔇 Cockpit (Rendre plus silencieux) :</strong><br>
      <code>gain = 0.3</code> → Si un son (ECS/Clim) casse les oreilles<br>
      <code>inner_radius = 5</code> → Réduit la zone d'impact
    </div>
    <div class="tip-box">
      <strong>💥 Explosions (Rendre plus "Loin") :</strong><br>
      <code>pitch_random = 0.2</code> → Chaque explosion aura un pitch différent (±20%) — anti-robot<br>
      <code>distance_filter_offset = 1000</code> → Son clair même de loin
    </div>

    <h3>🔁 Listes Aléatoires</h3>
    <pre>wave = {
    "Effects/Explosions/Boom_01",
    "Effects/Explosions/Boom_02",
    "Effects/Explosions/Boom_03"
}</pre>
    <div class="tip-box">
      Idéal pour les explosions, switchs, bruits mécaniques — chaque activation est unique.
    </div>
  `;
}

function themeGuide() {
  return `
    <h2>🎨 Theme Customization Guide</h2>

    <h3>What is a DCS Theme?</h3>
    <p>A theme allows you to customize the look of DCS World's user interface — including the main menu background, loading screen, briefing map, and mod icon.</p>

    <h3>File Requirements</h3>
    <table>
      <tr><th>File</th><th>Location</th><th>Size</th><th>Usage in DCS</th></tr>
      <tr><td><code>icon.png</code></td><td>Theme/</td><td>128 × 128 px</td><td>Mod icon in the DCS module manager</td></tr>
      <tr><td><code>MainMenulogo.png</code></td><td>Theme/ME/</td><td>Variable</td><td>Logo displayed on the main menu screen</td></tr>
      <tr><td><code>loading-window.png</code></td><td>Theme/ME/</td><td>1920 × 1080 px</td><td>Background image shown during mission loading</td></tr>
      <tr><td><code>briefing-map-default.png</code></td><td>Theme/ME/</td><td>Variable</td><td>Background of the mission briefing map screen</td></tr>
      <tr><td><code>base-menu-window.png</code></td><td>Theme/ME/</td><td>1920 × 1080 px</td><td>Main menu background image</td></tr>
    </table>

    <h3>Format Recommendations</h3>
    <ul>
      <li>All files must be <strong>PNG format</strong></li>
      <li>Use the exact recommended resolutions for best results</li>
      <li>The icon supports <strong>transparency</strong></li>
      <li>Loading and menu backgrounds should be <strong>1920×1080</strong> for full HD displays</li>
      <li>Larger images may work but will use more VRAM</li>
    </ul>

    <h3>Theme Folder Structure</h3>
    <pre>Theme/
├── icon.png
└── ME/
    ├── MainMenulogo.png
    ├── loading-window.png
    ├── briefing-map-default.png
    └── base-menu-window.png</pre>

    <div class="tip-box">
      Theme support must be enabled in the entry.lua with a <code>Skins</code> section and <code>mount_vfs_texture_path</code>. The Build page handles this automatically when you enable Theme.
    </div>
  `;
}

function installGuide() {
  return `
    <h2>📦 How to Install a DCS Sound Mod</h2>

    <h3>Installation Steps</h3>
    <ol>
      <li>Navigate to your DCS saved games folder:
        <pre>C:\\Users\\&lt;your username&gt;\\Saved Games\\DCS\\Mods\\resource\\</pre>
        <p style="font-size: 12px; color: var(--text-muted);">If the <code>resource</code> folder doesn't exist, create it.</p>
      </li>
      <li>Copy your entire mod folder (e.g., <code>SoundModBetterHornet/</code>) into the <code>resource</code> folder.</li>
      <li>Start DCS World.</li>
      <li>Your mod should be automatically detected and active!</li>
    </ol>

    <div class="warning-box">
      <strong>DCS Variant Suffixes:</strong> If you use DCS Open Beta, your saved games folder may be <code>DCS.openbeta</code> instead of <code>DCS</code>. Check which version you're running.
    </div>

    <h3>Final Folder Structure</h3>
    <pre>C:\\Users\\YourName\\Saved Games\\DCS\\Mods\\resource\\
└── SoundModYourMod/
    ├── entry.lua
    ├── Theme/  (optional)
    │   ├── icon.png
    │   └── ME/
    │       └── ...
    └── Sounds/
        ├── Effects/
        │   └── (your audio files)
        └── sdef/
            └── (your sdef files)</pre>

    <h3>Troubleshooting</h3>
    <ul>
      <li><strong>Sounds not playing:</strong> Check that your SDEF <code>wave</code> paths match the actual file locations in <code>Sounds/Effects/</code>.</li>
      <li><strong>Default sounds still play:</strong> Make sure <code>mount_vfs_sound_path</code> is present in entry.lua and the SDEF path matches the original DCS path exactly.</li>
      <li><strong>Theme not showing:</strong> Verify the <code>Skins</code> section exists in entry.lua and <code>mount_vfs_texture_path</code> is called.</li>
      <li><strong>Mod not detected:</strong> Make sure the mod is in the correct <code>Mods/resource/</code> directory for your DCS version.</li>
    </ul>

    <h3>Useful Links</h3>
    <ul>
      <li><a href="https://forums.eagle.ru/" target="_blank" style="color: var(--accent-blue);">Eagle Dynamics Forums</a></li>
      <li><a href="https://forums.eagle.ru/showthread.php?t=98014" target="_blank" style="color: var(--accent-blue);">Sound Modding Thread</a></li>
    </ul>
  `;
}
