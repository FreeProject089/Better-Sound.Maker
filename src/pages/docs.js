
/**
 * docs.js — Integrated documentation page
 * Audio Guide, SDEF Guide, Theme Guide
 */

import { t } from '../utils/i18n.js';
import { getIcon, renderIcons } from '../utils/icons.js';

export function renderDocs(container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${t('docs.title')}</h1>
      <p class="page-description">${t('docs.desc')}</p>
    </div>
    <div class="tabs" id="docs-tabs">
      <div class="tab active" data-tab="audio">${getIcon('music', 'w-4 h-4')} ${t('docs.tabs.audio')}</div>
      <div class="tab" data-tab="sdef">${getIcon('file-text', 'w-4 h-4')} ${t('docs.tabs.sdef')}</div>
      <div class="tab" data-tab="sdeflist">${getIcon('list', 'w-4 h-4')} ${t('docs.tabs.sdeflist') || 'Sdef List'}</div>
      <div class="tab" data-tab="types">${getIcon('tag', 'w-4 h-4')} ${t('docs.tabs.types') || 'Sound Types'}</div>
      <div class="tab" data-tab="theme">${getIcon('image', 'w-4 h-4')} ${t('docs.tabs.theme')}</div>
      <div class="tab" data-tab="install">${getIcon('download', 'w-4 h-4')} ${t('docs.tabs.install')}</div>
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

  renderIcons(container);
}

function showTab(tab) {
  const el = document.getElementById('docs-content');
  if (!el) return;

  switch (tab) {
    case 'audio': el.innerHTML = audioGuide(); break;
    case 'sdef': el.innerHTML = sdefGuide(); break;
    case 'sdeflist': el.innerHTML = sdeflistGuide(); break;
    case 'types': el.innerHTML = typesGuide(); break;
    case 'theme': el.innerHTML = themeGuide(); break;
    case 'install': el.innerHTML = installGuide(); break;
  }

  renderIcons(el);
}

function audioGuide() {
  return `
    <h2>${t('docs_content.audio.title')}</h2>

    <h3>${t('docs_content.audio.monoStereo.title')}</h3>
    <table>
      <tr><th>${t('docs_content.audio.monoStereo.table.use')}</th><th>${t('docs_content.audio.monoStereo.table.mono')}</th><th>${t('docs_content.audio.monoStereo.table.stereo')}</th></tr>
      <tr><td>${t('docs_content.audio.monoStereo.table.channels')}</td><td>${t('docs_content.audio.monoStereo.table.monoDesc')}</td><td>${t('docs_content.audio.monoStereo.table.stereoDesc')}</td></tr>
      <tr><td>${t('docs_content.audio.monoStereo.table.size')}</td><td>${t('docs_content.audio.monoStereo.table.smaller')}</td><td>${t('docs_content.audio.monoStereo.table.larger')}</td></tr>
      <tr><td>${t('docs_content.audio.monoStereo.table.spatial')}</td><td>${t('docs_content.audio.monoStereo.table.full3d')}</td><td>${t('docs_content.audio.monoStereo.table.limited3d')}</td></tr>
      <tr><td>${t('docs_content.audio.monoStereo.table.use')}</td><td>${t('docs_content.audio.monoStereo.table.engineSwitch')}</td><td>${t('docs_content.audio.monoStereo.table.ambient')}</td></tr>
    </table>
    <div class="tip-box">
      ${t('docs_content.audio.monoStereo.tip')}
    </div>

    <h3>${t('docs_content.audio.loopOneshot.title')}</h3>
    <p>${t('docs_content.audio.loopOneshot.desc')}</p>
    <ul>
      <li>${t('docs_content.audio.loopOneshot.loop')}</li>
      <li>${t('docs_content.audio.loopOneshot.oneshot')}</li>
    </ul>

    <div class="warning-box">
      ${t('docs_content.audio.loopOneshot.warning')}
    </div>
  `;
}

// ... audioGuide ...

function sdefGuide() {
  return `
    <h2>${t('docs_content.sdef.title')}</h2>

    <h3>${t('docs_content.sdef.whatIs.title')}</h3>
    <p>${t('docs_content.sdef.whatIs.p1')}</p>
    <p>${t('docs_content.sdef.whatIs.p2')}</p>

    <h3>${t('docs.loadSoundsTitle')}</h3>
    <p>${t('docs.loadSoundsDesc')}</p>
    <ol>
      <li>${t('docs.loadSoundsSteps.1')}</li>
      <li>${t('docs.loadSoundsSteps.2')}</li>
      <li>${t('docs.loadSoundsSteps.3')}</li>
      <li>${t('docs.loadSoundsSteps.4')}</li>
    </ol>
    <div class="tip-box">
      ${t('docs.overridePriority')}
    </div>

    <h3>${t('docs.fullRefTitle')}</h3>
    <table>
      <tr><th>${t('common.parameter')}</th><th>${t('common.type')}</th><th>${t('common.default')}</th><th>${t('common.description')}</th></tr>
      <tr><td><code>inherit</code></td><td>string</td><td>""</td><td>${t('sdef.params.inherit')}</td></tr>
      <tr><td><code>wave</code></td><td>string/list</td><td>"default"</td><td>${t('sdef.params.wave')}</td></tr>
      <tr><td><code>gain</code></td><td>number</td><td>1.0</td><td>${t('sdef.params.gain')}</td></tr>
      <tr><td><code>pitch</code></td><td>number</td><td>1.0</td><td>${t('sdef.params.pitch')}</td></tr>
      <tr><td><code>lowpass</code></td><td>number</td><td>24000</td><td>${t('sdef.params.lowpass')}</td></tr>
      <tr><td><code>position</code></td><td>{x,y,z}</td><td>{0,0,0}</td><td>${t('sdef.params.position')}</td></tr>
      <tr><td><code>silent_radius</code></td><td>number</td><td>0</td><td>${t('sdef.params.silent_radius')}</td></tr>
      <tr><td><code>peak_radius</code></td><td>number</td><td>0</td><td>${t('sdef.params.peak_radius')}</td></tr>
      <tr><td><code>inner_radius</code></td><td>number</td><td>1</td><td>${t('sdef.params.inner_radius')}</td></tr>
      <tr><td><code>outer_radius</code></td><td>number</td><td>1000</td><td>${t('sdef.params.outer_radius')}</td></tr>
      <tr><td><code>direction</code></td><td>{x,y,z}</td><td>{0,0,0}</td><td>${t('sdef.params.direction')}</td></tr>
      <tr><td><code>cone_inner_angle</code></td><td>number</td><td>0</td><td>${t('sdef.params.cone_inner_angle')}</td></tr>
      <tr><td><code>cone_outer_angle</code></td><td>number</td><td>0</td><td>${t('sdef.params.cone_outer_angle')}</td></tr>
      <tr><td><code>cone_outer_gain</code></td><td>number</td><td>1</td><td>${t('sdef.params.cone_outer_gain')}</td></tr>
      <tr><td><code>cone_outer_lowpass</code></td><td>number</td><td>24000</td><td>${t('sdef.params.cone_outer_lowpass')}</td></tr>
      <tr><td><code>detached</code></td><td>bool</td><td>false</td><td>${t('sdef.params.detached')}</td></tr>
      <tr><td><code>streaming</code></td><td>bool</td><td>false</td><td>${t('sdef.params.streaming')}</td></tr>
      <tr><td><code>listmode</code></td><td>enum</td><td>RANDOM</td><td>${t('sdef.params.listmode')}</td></tr>
      <tr><td><code>attack</code></td><td>number</td><td>0.0</td><td>${t('sdef.params.attack')}</td></tr>
      <tr><td><code>release</code></td><td>number</td><td>0.0</td><td>${t('sdef.params.release')}</td></tr>
      <tr><td><code>auto_width</code></td><td>bool</td><td>true</td><td>${t('sdef.params.auto_width')}</td></tr>
      <tr><td><code>nodoppler</code></td><td>bool</td><td>true</td><td>${t('sdef.params.nodoppler')}</td></tr>
      <tr><td><code>distance_filter_offset</code></td><td>number</td><td>0</td><td>${t('sdef.params.distance_filter_offset')}</td></tr>
    </table>

    <div class="detailed-params-section" style="margin-top: 32px; margin-bottom: 32px;">
      <h3>${t('docs_content.sdef.detailed.title')}</h3>
      
      <div class="card" style="margin-bottom: 16px;">
        <h4 style="margin-top: 0; margin-bottom: 8px; color: var(--accent-blue); display: flex; align-items: center; gap: 8px;">
            ${getIcon('list', 'w-4 h-4')} ${t('docs_content.sdef.detailed.listmodeTitle')}
        </h4>
        <p style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);">${t('docs_content.sdef.detailed.listmodeDesc')}</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <li>${t('docs_content.sdef.detailed.listmodeRandom')}</li>
          <li>${t('docs_content.sdef.detailed.listmodeSeq')}</li>
          <li>${t('docs_content.sdef.detailed.listmodeASR')}</li>
        </ul>
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <h4 style="margin-top: 0; margin-bottom: 8px; color: var(--accent-blue); display: flex; align-items: center; gap: 8px;">
            ${getIcon('activity', 'w-4 h-4')} ${t('docs_content.sdef.detailed.dopplerTitle')}
        </h4>
        <p style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);">${t('docs_content.sdef.detailed.dopplerDesc')}</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
          <li>${t('docs_content.sdef.detailed.dopplerTrue')}</li>
          <li>${t('docs_content.sdef.detailed.dopplerFalse')}</li>
        </ul>
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <h4 style="margin-top: 0; margin-bottom: 8px; color: var(--accent-blue); display: flex; align-items: center; gap: 8px;">
            ${getIcon('crosshair', 'w-4 h-4')} ${t('docs_content.sdef.detailed.coneTitle')}
        </h4>
        <p style="margin-bottom: 0; font-size: 14px; color: var(--text-secondary);">${t('docs_content.sdef.detailed.coneDesc')}</p>
      </div>
    </div>

    <h3>${t('docs.examples.switch')}</h3>
    <pre>wave = "Effects/Aircrafts/A-10C_2/Cockpit/SW_07_Up"
inner_radius = 50
gain = 1</pre>

    <h3>${t('docs.examples.random')}</h3>
    <pre>wave = {
    "Effects/Aircrafts/A-10C_2/Cockpit/SW_01_1",
    "Effects/Aircrafts/A-10C_2/Cockpit/SW_01_2",
    "Effects/Aircrafts/A-10C_2/Cockpit/SW_01_3",
    "Effects/Aircrafts/A-10C_2/Cockpit/SW_01_4",
}
listmode = RANDOM
inner_radius = 50
gain = 1</pre>
    <div class="tip-box">
      ${t('docs_content.f18.tips.randomListDesc') || 'Using multiple wave files with RANDOM listmode will play a random sound each time. You can also use SEQUENCE (plays in order) or ASR (Attack-Sustain-Release: first file on start, loops second, plays third on stop).'}
    </div>

    <h3>${t('docs.examples.engine')}</h3>
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

    <h3>${t('docs_content.defaults.title') || 'Recommended Defaults per Sound Type'}</h3>
    <p>${t('docs_content.defaults.desc') || 'The mod creator auto-fills these values based on sound type:'}</p>
    <table>
      <tr><th>${t('common.type')}</th><th>inner_radius</th><th>outer_radius</th><th>gain</th><th>detached</th><th>${t('common.notes')}</th></tr>
      <tr><td>${getIcon('mic', 'w-3 h-3')} Cockpit</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Switches, buttons, knobs, MFD sounds</td></tr>
      <tr><td>${getIcon('plane', 'w-3 h-3')} Engine</td><td>30</td><td>10000</td><td>0.9</td><td>—</td><td>Engine loops, startup, spooldown</td></tr>
      <tr><td>${getIcon('crosshair', 'w-3 h-3')} Weapon</td><td>80</td><td>12000</td><td>1</td><td>true</td><td>Gunfire, missile launch, explosions</td></tr>
      <tr><td>${getIcon('bell', 'w-3 h-3')} Warning</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Altitude, bingo, caution tones</td></tr>
      <tr><td>${getIcon('radio', 'w-3 h-3')} Radio</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Betty voice, radio comms</td></tr>
      <tr><td>${getIcon('wind', 'w-3 h-3')} Aero</td><td>20</td><td>5000</td><td>0.8</td><td>—</td><td>Wind, airflow, aerodynamic sounds</td></tr>
      <tr><td>${getIcon('arrow-down-circle', 'w-3 h-3')} Gear</td><td>40</td><td>3000</td><td>1</td><td>true</td><td>Landing gear, flaps, speedbrake</td></tr>
      <tr><td>${getIcon('zap', 'w-3 h-3')} Systems</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Hydraulics, electrics, fuel pumps</td></tr>
      <tr><td>${getIcon('cloud', 'w-3 h-3')} Environment</td><td>100</td><td>15000</td><td>0.7</td><td>—</td><td>Rain, thunder, tarmac wind</td></tr>
      <tr><td>${getIcon('refresh-cw', 'w-3 h-3')} Rotor</td><td>50</td><td>12000</td><td>0.9</td><td>—</td><td>Helicopter rotor/transmission</td></tr>
      <tr><td>${getIcon('send', 'w-3 h-3')} Flyby</td><td>60</td><td>8000</td><td>1</td><td>true</td><td>Aircraft pass-by sounds</td></tr>
      <tr><td>${getIcon('sparkles', 'w-3 h-3')} Effects</td><td>40</td><td>3000</td><td>1</td><td>true</td><td>Chaff, flare, sonic boom</td></tr>
      <tr><td>${getIcon('truck', 'w-3 h-3')} Ground</td><td>40</td><td>2000</td><td>1</td><td>—</td><td>Ground vehicles, tracks</td></tr>
      <tr><td>${getIcon('monitor', 'w-3 h-3')} UI</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Menu clicks, interface sounds</td></tr>
      <tr><td>${getIcon('volume-2', 'w-3 h-3')} Generic</td><td>50</td><td>—</td><td>1</td><td>—</td><td>Any other/unknown type</td></tr>
    </table>
    <div class="tip-box">
      ${t('docs_content.defaults.note') || 'Note: A "—" means the default of the engine is used.'}
    </div>

    <h3>${t('docs_content.gain.title')}</h3>
    <p>${t('docs_content.gain.desc')}</p>
    
    <svg class="gain-chart" viewBox="0 0 600 240" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="600" height="240" fill="transparent" />
        <line x1="50" y1="200" x2="550" y2="200" class="chart-axis" stroke-dasharray="0" />
        <line x1="50" y1="200" x2="50" y2="20" class="chart-axis" stroke-dasharray="0" />
        <line x1="50" y1="50" x2="550" y2="50" class="chart-axis" />
        <line x1="50" y1="72.5" x2="550" y2="72.5" class="chart-axis" />
        <path d="M50,200 L120,50 L200,72.5 Q350,200 500,200 L500,200 L50,200 Z" class="gain-area" />
        <path d="M50,200 L120,50 L200,72.5 C300,150 400,190 500,200" class="gain-line" />
        <circle cx="50" cy="200" r="4" class="chart-point" />
        <circle cx="120" cy="50" r="4" class="chart-point" />
        <circle cx="200" cy="72.5" r="4" class="chart-point" />
        <circle cx="500" cy="200" r="4" class="chart-point" />
        <text x="35" y="215" class="chart-text" text-anchor="end">0.0</text>
        <text x="35" y="76" class="chart-text" text-anchor="end">0.85</text>
        <text x="35" y="54" class="chart-text" text-anchor="end">1.0</text>
        <text x="35" y="30" class="chart-text label" text-anchor="end">Gain</text>
        <text x="50" y="225" class="chart-text label" text-anchor="middle">silent</text>
        <text x="120" y="225" class="chart-text label" text-anchor="middle">peak</text>
        <text x="200" y="225" class="chart-text label" text-anchor="middle">inner</text>
        <text x="500" y="225" class="chart-text label" text-anchor="middle">outer</text>
        <text x="560" y="204" class="chart-text label">Dist</text>
    </svg>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 16px;">
       <div class="card" style="padding: 12px;">
         <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${t('docs_content.gain.rampUp.title')}</div>
         <div style="font-size: 12px; color: var(--text-secondary);">${t('docs_content.gain.rampUp.desc')}</div>
       </div>
       <div class="card" style="padding: 12px;">
         <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${t('docs_content.gain.peak.title')}</div>
         <div style="font-size: 12px; color: var(--text-secondary);">${t('docs_content.gain.peak.desc')}</div>
       </div>
       <div class="card" style="padding: 12px;">
         <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${t('docs_content.gain.reference.title')}</div>
         <div style="font-size: 12px; color: var(--text-secondary);">${t('docs_content.gain.reference.desc')}</div>
       </div>
       <div class="card" style="padding: 12px;">
         <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${t('docs_content.gain.falloff.title')}</div>
         <div style="font-size: 12px; color: var(--text-secondary);">${t('docs_content.gain.falloff.desc')}</div>
       </div>
    </div>
  `;
}

function sdeflistGuide() {
  return `
    <h2>${t('docs.sdeflist.title') || 'Where to find sdef_and_wave_list.txt'}</h2>
    <p>${t('docs.sdeflist.desc') || 'The file <code>sdef_and_wave_list.txt</code> contains the full exhaustive list of all sound events and parameters inside DCS World.'}</p>
    
    <h3>${t('docs.sdeflist.location') || 'File Location'}</h3>
    <pre>\\DCS World\\Doc\\Sounds\\sdef_and_wave_list.txt</pre>
    <div class="tip-box">
      ${t('docs.sdeflist.tip') || 'You can find it in the installation directory of DCS World. Usually located in your Program Files or Saved Games depending on your setup.'}
      <br><br>💡 <b>Note:</b> Better ModMaker now includes a native Scanner that automatically finds this file and scans your CoreMods/Saved Games!
    </div>
  `;
}

function typesGuide() {
  return `
    <h2>${t('docs_content.types.title') || 'Custom Sound Types & Regex Rules'}</h2>
    <p>${t('docs_content.types.intro') || 'The Asset Library uses <strong>Regex (Regular Expressions)</strong> to automatically categorize your sounds based on their SDEF file paths. By default, the app can spot Radios, Weapons, Engines, etc. But if you work on a specific mod, you might want to create your own types!'}</p>
    
    <h3>${t('docs_content.types.whatIsRegex') || 'What is a Regex Pattern?'}</h3>
    <p>${t('docs_content.types.regexDesc') || 'A Regex pattern is a sequence of characters that specifies a search pattern in text. When ModMaker scans a file like <code>Effects/Aircrafts/F16/Engine/Burner.sdef</code>, it tests your rules to see which Custom Type to assign.'}</p>

    <div class="doc-reference-grid" style="margin-top: 16px;">
        <div class="ref-section-card">
            <div class="ref-card-header"><strong>${t('docs_content.types.basic.title') || 'Basic Word Matching'}</strong></div>
            <div class="ref-card-details">
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">${t('docs_content.types.basic.desc') || 'Just type the folder or word you want to find. It is case-insensitive.'}</p>
                <div style="background: var(--bg-surface); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; margin-bottom: 8px;">
                    Pattern: <code>afterburner</code><br>
                    Matches: <code>.../Engine/<b>afterburner</b>.sdef</code>
                </div>
            </div>
        </div>

        <div class="ref-section-card">
            <div class="ref-card-header"><strong>${t('docs_content.types.or.title') || 'The OR Operator (|)'}</strong></div>
            <div class="ref-card-details">
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">${t('docs_content.types.or.desc') || 'Use the vertical pipe symbol <code>|</code> to say "Match this OR that". Perfect for grouping multiple folders.'}</p>
                <div style="background: var(--bg-surface); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; margin-bottom: 8px;">
                    Pattern: <code>gun|cannon|vulcan</code><br>
                    Matches: <code>.../<b>gun</b>_fire.sdef</code>
                </div>
            </div>
        </div>

        <div class="ref-section-card">
            <div class="ref-card-header"><strong>${t('docs_content.types.strict.title') || 'Strict Matching (^ and $)'}</strong></div>
            <div class="ref-card-details">
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">${t('docs_content.types.strict.desc') || 'Use <code>^</code> for the start of the path, and <code>$</code> for the end.'}</p>
                <div style="background: var(--bg-surface); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; margin-bottom: 8px;">
                    Pattern: <code>alerts/.*\\.sdef$</code><br>
                    Matches only items ending in .sdef inside an exact 'alerts' structure.
                </div>
            </div>
        </div>

        <div class="ref-section-card">
            <div class="ref-card-header"><strong>${t('docs_content.types.examples.title') || 'Practical Examples'}</strong></div>
            <div class="ref-card-details">
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">${t('docs_content.types.examples.desc') || 'Common use-cases when creating custom types for DCS.'}</p>
                
                <div style="margin-bottom: 12px;">
                    <strong style="font-size: 12px; color: var(--text-primary);">${t('docs_content.types.examples.ex1Title') || 'Ex 1: All F-16 Engines'}</strong>
                    <div style="background: var(--bg-surface); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; margin-top: 4px;">
                        Pattern: <code>f16.*/engine</code><br>
                        Matches: <code>Aircrafts/<b>F16/Engine</b>/Burner.sdef</code>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <strong style="font-size: 12px; color: var(--text-primary);">${t('docs_content.types.examples.ex2Title') || 'Ex 2: Specific Weapons'}</strong>
                    <div style="background: var(--bg-surface); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; margin-top: 4px;">
                        Pattern: <code>aim9|aim120|sparrow</code><br>
                        Matches: <code>Weapons/Missiles/<b>aim120</b>_launch.sdef</code>
                    </div>
                </div>

                <div style="margin-bottom: 4px;">
                    <strong style="font-size: 12px; color: var(--text-primary);">${t('docs_content.types.examples.ex3Title') || 'Ex 3: Exact file match'}</strong>
                    <div style="background: var(--bg-surface); padding: 8px; border-radius: 4px; font-family: monospace; font-size: 11px; margin-top: 4px;">
                        Pattern: <code>cockpit/warning_beep\\.sdef$</code><br>
                        Matches exactly that file, not <code>warning_beep_2.sdef</code>.
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="tip-box" style="margin-top: 24px;">
      ${getIcon('alert-triangle', 'w-4 h-4')} <strong>${t('docs_content.types.priorityTitle') || 'Rule Priority:'}</strong> ${t('docs_content.types.priorityDesc') || 'Custom Rules are evaluated FIRST, top to bottom. If no custom rule matches the SDEF path, the built-in default rules are then used.'}
    </div>

    <h3>${t('docs_content.types.share.title') || 'Sharing Types'}</h3>
    <p>${t('docs_content.types.share.desc') || 'Once you have created types for your mod (e.g., F-14 RIO chatter, F-16 MFD buttons), you can export them. Even better, when you share a Presets file, you can embed your Custom Types into it! When someone imports your preset, ModMaker will automatically install the missing Types and Icons into their library.'}</p>
  `;
}

function f18Reference() {
  return `
    <h2>${t('docs_content.f18.title')}</h2>
    <p>${t('docs_content.f18.desc')}</p>

    <div class="tip-box">
      ${t('docs_content.f18.tipMono')}
    </div>

    <div class="warning-box">
      ${t('docs_content.f18.warningLoop')}
    </div>

    <h3 style="margin-top:24px; border-bottom:1px solid var(--border-subtle); padding-bottom:8px;">${t('docs.fullRefTitle')}</h3>
    
    <div class="doc-reference-grid">
        ${renderRefSection(t('docs_content.f18.sections.engines'), 'Effects/Aircrafts/Engines/F18...', 'Loop', 'Mono', 'External')}
        ${renderRefSection(t('docs_content.f18.sections.flyby'), 'Effects/Aircrafts/F18...', 'One-Shot', 'Mono', 'External')}
        ${renderRefSection(t('docs_content.f18.sections.cockpit'), 'Effects/Aircrafts/Cockpits/F18...', 'Loop', 'Stereo', 'Internal')}
        ${renderRefSection(t('docs_content.f18.sections.switches'), 'Effects/Aircrafts/Cockpits/F18/Switch...', 'One-Shot', 'Mono', 'Internal')}
        ${renderRefSection(t('docs_content.f18.sections.betty'), 'Effects/Aircrafts/Cockpits/F18/Betty...', 'One-Shot', 'Stereo', 'Internal')}
        ${renderRefSection(t('docs_content.f18.sections.tones'), 'Effects/Aircrafts/Cockpits/F18/Tones...', 'Loop/One-Shot', 'Stereo', 'Internal')}
        ${renderRefSection(t('docs_content.f18.sections.weapons'), 'Effects/Weapons...', 'One-Shot', 'Mono', 'External')}
        ${renderRefSection(t('docs_content.f18.sections.explosions'), 'Effects/Explosions...', 'One-Shot', 'Mono', 'External')}
        ${renderRefSection(t('docs_content.f18.sections.damage'), 'Effects/Damage...', 'One-Shot', 'Mono', 'External')}
    </div>

    <div style="margin-top:32px;">
        <h3>${t('docs_content.f18.sections.customTips')}</h3>
        <div class="doc-tip-box">
            ${t('docs_content.f18.tips.enginePitch')}
        </div>
        <div class="doc-tip-box">
            ${t('docs_content.f18.tips.cockpitQuiet')}
        </div>
        <div class="doc-tip-box">
            ${t('docs_content.f18.tips.explosionsDist')}
        </div>
    </div>

    <div style="margin-top:32px;">
         <h3>${t('docs_content.f18.sections.randomLists')}</h3>
         <p>${t('docs_content.f18.tips.randomListDesc')}</p>
         <pre><code>
wave = {
    "Effects/Explosions/Exp1.wav",
    "Effects/Explosions/Exp2.wav",
    "Effects/Explosions/Exp3.wav"
}
listmode = "RANDOM"
         </code></pre>
    </div>
  `;
}

function renderRefSection(title, path, type, channels, loc) {
  return `
    <div class="ref-section-card">
        <div class="ref-card-header">
            <strong>${title}</strong>
        </div>
        <div class="ref-card-details">
            <div><span class="ref-label">Path:</span> <code>${path}</code></div>
            <div class="ref-tags">
                <span class="tag">${type}</span>
                <span class="tag ${channels === 'Mono' ? 'tag-green' : 'tag-amber'}">${channels}</span>
                <span class="tag tag-blue">${loc}</span>
            </div>
        </div>
    </div>
    `;
}

function themeGuide() {
  return `
    <h2>${t('docs_content.theme.title')}</h2>

    <h3>${t('docs_content.theme.whatIs.title')}</h3>
    <p>${t('docs_content.theme.whatIs.desc')}</p>

    <h3>${t('docs_content.theme.fileRequirements.title')}</h3>
    <table>
      <tr><th>${t('docs_content.theme.fileRequirements.file')}</th><th>${t('docs_content.theme.fileRequirements.location')}</th><th>${t('docs_content.theme.fileRequirements.size')}</th><th>${t('docs_content.theme.fileRequirements.usage')}</th></tr>
      <tr><td><code>icon.png</code></td><td>Theme/</td><td>86 × 86 px</td><td>${t('docs_content.theme.fileRequirements.iconUsage')}</td></tr>
      <tr><td><code>MainMenulogo.png</code></td><td>Theme/ME/</td><td>${t('docs_content.theme.fileRequirements.logoSize')}</td><td>${t('docs_content.theme.fileRequirements.logoUsage')}</td></tr>
      <tr><td><code>loading-window.png</code></td><td>Theme/ME/</td><td>1920 × 1080 px (min)</td><td>${t('docs_content.theme.fileRequirements.loadingUsage')}</td></tr>
      <tr><td><code>briefing-map-default.png</code></td><td>Theme/ME/</td><td>${t('docs_content.theme.fileRequirements.briefingSize')}</td><td>${t('docs_content.theme.fileRequirements.briefingUsage')}</td></tr>
      <tr><td><code>base-menu-window.png</code></td><td>Theme/ME/</td><td>1920 × 1080 px (min)</td><td>${t('docs_content.theme.fileRequirements.menuUsage')}</td></tr>
    </table>

    <h3>${t('docs_content.theme.formatRecommendations.title')}</h3>
    <ul>
      <li>${t('docs_content.theme.formatRecommendations.png')}</li>
      <li>${t('docs_content.theme.formatRecommendations.resolution')}</li>
      <li>${t('docs_content.theme.formatRecommendations.transparency')}</li>
      <li>${t('docs_content.theme.formatRecommendations.hd')}</li>
      <li>${t('docs_content.theme.formatRecommendations.vram')}</li>
    </ul>

    <h3>${t('docs_content.theme.folderStructure.title')}</h3>
    <pre>Theme/
├── icon.png
└── ME/
    ├── MainMenulogo.png
    ├── loading-window.png
    ├── briefing-map-default.png
    └── base-menu-window.png</pre>

    <div class="tip-box">
      ${t('docs_content.theme.tip')}
    </div>
  `;
}

function installGuide() {
  return `
    <h2>${t('docs_content.install.title')}</h2>

    <h3>${t('docs_content.install.steps')}</h3>
    <ol>
      <li>${t('docs_content.install.step1')}
        <pre>C:\\Users\\&lt;your username&gt;\\Saved Games\\DCS\\Mods\\resource\\</pre>
        <p style="font-size: 12px; color: var(--text-muted);">${t('docs_content.install.tip1')}</p>
      </li>
      <li>${t('docs_content.install.step2')}</li>
      <li>${t('docs_content.install.step3')}</li>
      <li>${t('docs_content.install.step4')}</li>
    </ol>

    <div class="warning-box">
      ${t('docs_content.install.variantWarning')}
    </div>

    <h3>${t('docs_content.install.folderStructure')}</h3>
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

    <h3>${t('docs_content.install.trouble')}</h3>
    <ul>
      <li>${t('docs_content.install.trouble1')}</li>
      <li>${t('docs_content.install.trouble2')}</li>
      <li>${t('docs_content.install.trouble3')}</li>
      <li>${t('docs_content.install.trouble4')}</li>
    </ul>

    <h3>${t('docs_content.install.links')}</h3>
    <ul>
      <li><a href="https://forums.eagle.ru/" target="_blank" style="color: var(--accent-blue);">Eagle Dynamics Forums</a></li>
      <li><a href="https://forums.eagle.ru/showthread.php?t=98014" target="_blank" style="color: var(--accent-blue);">Sound Modding Thread</a></li>
    </ul>
  `;
}
