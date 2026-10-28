//! Better Sound.Maker — Tauri backend.
//!
//! Ports the former Electron IPC surface (electron/main.js) to Tauri commands.
//! The frontend reaches these through `src/platform/native.js`, which exposes
//! them as `window.nativeAPI`.

use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::ipc::{InvokeBody, Request, Response};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

type CmdResult<T> = Result<T, String>;

fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}

fn ensure_parent(path: &Path) -> CmdResult<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(err)?;
    }
    Ok(())
}

/* ── Dialog ──────────────────────────────────────────────────────── */

/// Open a native folder picker; returns the chosen path or null.
#[tauri::command]
async fn select_directory(app: AppHandle) -> Option<String> {
    app.dialog()
        .file()
        .set_title("Choose Export Location")
        .blocking_pick_folder()
        .and_then(|p| p.into_path().ok())
        .map(|p| p.to_string_lossy().replace('\\', "/"))
}

/* ── File system ─────────────────────────────────────────────────── */

/// Write a UTF-8 text file, creating intermediate directories.
#[tauri::command]
async fn write_file(path: String, content: String) -> CmdResult<bool> {
    let p = PathBuf::from(path);
    ensure_parent(&p)?;
    fs::write(&p, content).map_err(err)?;
    Ok(true)
}

/// Write raw bytes. The body is the binary payload; the target path is
/// passed URI-encoded in the `x-path` header so audio never goes through JSON.
#[tauri::command]
async fn write_buffer(request: Request<'_>) -> CmdResult<bool> {
    let encoded = request
        .headers()
        .get("x-path")
        .and_then(|v| v.to_str().ok())
        .ok_or("missing x-path header")?;
    let path = percent_decode(encoded);
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("expected raw binary body".into());
    };
    let p = PathBuf::from(path);
    ensure_parent(&p)?;
    fs::write(&p, bytes).map_err(err)?;
    Ok(true)
}

/// Encode PCM to Ogg Vorbis (the format DCS reads besides WAV).
///
/// Body: planar little-endian f32 samples, channel after channel.
/// Headers: `x-channels` (1–2), `x-rate` (Hz), optional `x-quality` (-0.1..1, default 0.5).
#[tauri::command]
async fn encode_ogg(request: Request<'_>) -> CmdResult<Response> {
    let header = |name: &str| {
        request
            .headers()
            .get(name)
            .and_then(|v| v.to_str().ok())
            .map(str::to_owned)
    };
    let channels: u8 = header("x-channels").and_then(|v| v.parse().ok()).ok_or("bad x-channels")?;
    let rate: u32 = header("x-rate").and_then(|v| v.parse().ok()).ok_or("bad x-rate")?;
    let quality: f32 = header("x-quality").and_then(|v| v.parse().ok()).unwrap_or(0.5);
    let InvokeBody::Raw(bytes) = request.body() else {
        return Err("expected raw binary body".into());
    };
    if channels == 0 || channels > 2 || bytes.len() % (4 * channels as usize) != 0 {
        return Err("PCM size does not match the channel count".into());
    }
    let samples: Vec<f32> = bytes
        .chunks_exact(4)
        .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
        .collect();
    let frames = samples.len() / channels as usize;
    let planes: Vec<&[f32]> = samples.chunks(frames.max(1)).collect();
    encode_vorbis(&planes, rate, quality).map(Response::new)
}

fn encode_vorbis(planes: &[&[f32]], rate: u32, quality: f32) -> CmdResult<Vec<u8>> {
    use vorbis_rs::{VorbisBitrateManagementStrategy, VorbisEncoderBuilder};
    let channels = u8::try_from(planes.len()).map_err(err)?;
    let frames = planes.first().map_or(0, |p| p.len());
    let mut out = Vec::new();
    let mut enc = VorbisEncoderBuilder::new(
        std::num::NonZeroU32::new(rate).ok_or("rate is 0")?,
        std::num::NonZeroU8::new(channels).ok_or("channels is 0")?,
        &mut out,
    )
    .map_err(err)?
    .bitrate_management_strategy(VorbisBitrateManagementStrategy::QualityVbr {
        target_quality: quality.clamp(-0.1, 1.0),
    })
    .build()
    .map_err(err)?;
    // Feed in blocks to keep libvorbis' internal buffers small
    const BLOCK: usize = 4096;
    let mut start = 0;
    while start < frames {
        let end = (start + BLOCK).min(frames);
        let block: Vec<&[f32]> = planes.iter().map(|p| &p[start..end]).collect();
        enc.encode_audio_block(&block).map_err(err)?;
        start = end;
    }
    enc.finish().map_err(err)?;
    Ok(out)
}


#[tauri::command]
async fn mkdir(path: String) -> CmdResult<bool> {
    fs::create_dir_all(path).map_err(err)?;
    Ok(true)
}

/// Read a file as raw bytes (arrives as ArrayBuffer in JS).
/// Errors when missing; the JS bridge maps that to null.
#[tauri::command]
async fn read_file(path: String) -> CmdResult<Response> {
    fs::read(&path).map(Response::new).map_err(err)
}

/// Read a file as UTF-8 text (lossy). Missing → null.
#[tauri::command]
async fn read_text_file(path: String) -> Option<String> {
    fs::read(&path)
        .ok()
        .map(|b| String::from_utf8_lossy(&b).into_owned())
}

#[tauri::command]
async fn read_dir(path: String) -> Vec<String> {
    fs::read_dir(path)
        .map(|it| {
            it.filter_map(|e| e.ok())
                .map(|e| e.file_name().to_string_lossy().into_owned())
                .collect()
        })
        .unwrap_or_default()
}

#[tauri::command]
async fn exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ScannedSdef {
    rel_path: String,
    content: String,
    waves: Vec<String>,
}

/// Recursively scan for .sdef files and extract their `wave = "..."` entries.
#[tauri::command]
async fn scan_sdefs(root: String) -> Vec<ScannedSdef> {
    let root_path = PathBuf::from(&root);
    if !root_path.exists() {
        return Vec::new();
    }
    walkdir::WalkDir::new(&root_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.file_type().is_file()
                && e.file_name()
                    .to_string_lossy()
                    .to_lowercase()
                    .ends_with(".sdef")
        })
        .filter_map(|e| {
            let bytes = fs::read(e.path()).ok()?;
            let content = String::from_utf8_lossy(&bytes).into_owned();
            let waves = parse_waves(&content);
            let rel_path = e
                .path()
                .strip_prefix(&root_path)
                .ok()?
                .to_string_lossy()
                .replace('\\', "/");
            Some(ScannedSdef { rel_path, content, waves })
        })
        .collect()
}

fn parse_waves(content: &str) -> Vec<String> {
    content
        .lines()
        .map(str::trim)
        .filter(|l| l.starts_with("wave") && l.contains('"'))
        .filter_map(|l| {
            let start = l.find('"')? + 1;
            let len = l[start..].find('"')?;
            let w = l[start..start + len].replace("\\\\", "/").replace('\\', "/");
            Some(w.trim_start_matches('/').to_string())
        })
        .collect()
}

fn percent_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(b) = u8::from_str_radix(&s[i + 1..i + 3], 16) {
                out.push(b);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

/* ── App ─────────────────────────────────────────────────────────── */

/// Directory holding bundled resources (Update/, LICENSE, presets…).
#[tauri::command]
fn get_app_path(app: AppHandle) -> CmdResult<String> {
    let dir = app.path().resource_dir().map_err(err)?;
    Ok(dir.to_string_lossy().replace('\\', "/"))
}

#[tauri::command]
fn get_user_home(app: AppHandle) -> CmdResult<String> {
    let dir = app.path().home_dir().map_err(err)?;
    Ok(dir.to_string_lossy().replace('\\', "/"))
}

/// Open a file or folder with the OS default handler.
#[tauri::command]
fn open_path(app: AppHandle, path: String) -> CmdResult<()> {
    app.opener().open_path(path, None::<&str>).map_err(err)
}

/* ── DCS install detection ───────────────────────────────────────── */

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DcsInstall {
    path: String,
    /// Last change of Doc/Sounds/sdef_and_wave_list.txt (seconds since epoch):
    /// the newest one is the install DCS last updated.
    list_modified: u64,
}

/// Look for DCS installs on every drive (common folders) and return them,
/// newest sound list first.
#[tauri::command]
async fn detect_dcs_installs() -> Vec<DcsInstall> {
    const SUBDIRS: [&str; 8] = [
        "DCS World", "DCS World OpenBeta", "Program Files/Eagle Dynamics/DCS World",
        "Program Files/Eagle Dynamics/DCS World OpenBeta", "Games/DCS World", "Eagle Dynamics/DCS World",
        "SteamLibrary/steamapps/common/DCSWorld", "Program Files (x86)/Steam/steamapps/common/DCSWorld",
    ];
    let mut found = Vec::new();
    for letter in b'C'..=b'Z' {
        let drive = format!("{}:/", letter as char);
        if !Path::new(&drive).exists() {
            continue;
        }
        for sub in SUBDIRS {
            let root = PathBuf::from(&drive).join(sub);
            let list = root.join("Doc/Sounds/sdef_and_wave_list.txt");
            if let Ok(meta) = fs::metadata(&list) {
                let list_modified = meta
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map_or(0, |d| d.as_secs());
                found.push(DcsInstall { path: root.to_string_lossy().replace('\\', "/"), list_modified });
            }
        }
    }
    found.sort_by(|a, b| b.list_modified.cmp(&a.list_modified));
    found
}

/* ── Readable DCS audio index ────────────────────────────────────── */

/// Every audio file DCS ships as a plain file: `<root>/{CoreMods,Mods}/<cat>/<module>/Sounds/Effects/**`.
/// Key: path under Effects, lowercase, forward slashes, without extension
/// (that's how `wave` names it). Value: absolute path. Sounds inside the
/// packed Sounds.edce are not listed: they are not readable.
#[tauri::command]
async fn index_dcs_waves(dcs_path: String) -> std::collections::HashMap<String, String> {
    let mut out = std::collections::HashMap::new();
    let root = PathBuf::from(&dcs_path);
    for top in ["CoreMods", "Mods"] {
        let Ok(categories) = fs::read_dir(root.join(top)) else { continue };
        for cat in categories.filter_map(|e| e.ok()).filter(|e| e.path().is_dir()) {
            let Ok(modules) = fs::read_dir(cat.path()) else { continue };
            for module in modules.filter_map(|e| e.ok()) {
                let effects = module.path().join("Sounds").join("Effects");
                if !effects.is_dir() {
                    continue;
                }
                for e in walkdir::WalkDir::new(&effects).into_iter().filter_map(|e| e.ok()) {
                    let p = e.path();
                    let ext = p.extension().and_then(|x| x.to_str()).map(str::to_ascii_lowercase);
                    if !matches!(ext.as_deref(), Some("wav" | "ogg")) {
                        continue;
                    }
                    let Ok(rel) = p.strip_prefix(&effects) else { continue };
                    let key = rel.with_extension("").to_string_lossy().replace('\\', "/").to_lowercase();
                    out.entry(key).or_insert_with(|| p.to_string_lossy().replace('\\', "/"));
                }
            }
        }
    }
    out
}

/* ── Original DCS audio (A/B comparison) ─────────────────────────── */

/// Find the game's own audio for a `wave` path. Module sounds are plain files
/// under `<root>/{CoreMods,Mods}/<category>/<module>/Sounds/Effects`; the base
/// game's sounds are inside the packed `Sounds.edce` and cannot be read.
/// Returns the first match, or null.
#[tauri::command]
async fn find_dcs_wave(dcs_path: String, wave: String) -> Option<String> {
    let rel = wave.replace('\\', "/");
    let rel = rel.trim_start_matches('/');
    let rel = rel.strip_prefix("Effects/").unwrap_or(rel);
    let has_ext = Path::new(rel).extension().is_some();
    let candidates: Vec<String> = if has_ext {
        vec![rel.to_string()]
    } else {
        vec![format!("{rel}.wav"), format!("{rel}.ogg")]
    };
    let root = PathBuf::from(&dcs_path);
    for top in ["CoreMods", "Mods"] {
        let Ok(categories) = fs::read_dir(root.join(top)) else { continue };
        for cat in categories.filter_map(|e| e.ok()).filter(|e| e.path().is_dir()) {
            let Ok(modules) = fs::read_dir(cat.path()) else { continue };
            for module in modules.filter_map(|e| e.ok()) {
                let effects = module.path().join("Sounds").join("Effects");
                for c in &candidates {
                    let p = effects.join(c);
                    if p.is_file() {
                        return Some(p.to_string_lossy().replace('\\', "/"));
                    }
                }
            }
        }
    }
    None
}

/* ── Diagnostics: crash logs ─────────────────────────────────────── */

/// Where crash logs and panic reports go: the OS app-log folder
/// (%LOCALAPPDATA%\com.bettersoundmaker.app\logs on Windows).
fn logs_dir(app: &AppHandle) -> CmdResult<PathBuf> {
    let dir = app.path().app_log_dir().map_err(err)?;
    fs::create_dir_all(&dir).map_err(err)?;
    Ok(dir)
}

fn timestamp() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    // UTC yyyymmdd-hhmmss without a date crate (civil-from-days, Howard Hinnant)
    let (days, rem) = (secs / 86_400, secs % 86_400);
    let z = days as i64 + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = yoe + era * 400 + i64::from(m <= 2);
    format!("{y:04}{m:02}{d:02}-{:02}{:02}{:02}", rem / 3600, rem % 3600 / 60, rem % 60)
}

/// Write a Rust panic (message, location, backtrace) next to the crash logs
/// before the process dies, so the next start can include it in a report.
fn install_panic_hook(dir: PathBuf) {
    let default = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        let report = format!(
            "Better Sound.Maker {} — Rust panic\nTime (UTC): {}\nOS: {} {}\n\n{info}\n\nBacktrace:\n{}\n",
            env!("CARGO_PKG_VERSION"),
            timestamp(),
            std::env::consts::OS,
            std::env::consts::ARCH,
            std::backtrace::Backtrace::force_capture(),
        );
        let _ = fs::create_dir_all(&dir);
        let _ = fs::write(dir.join(format!("panic-{}.log", timestamp())), report);
        default(info);
    }));
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    version: &'static str,
    tauri_version: &'static str,
    os: &'static str,
    os_family: &'static str,
    arch: &'static str,
    exe_path: String,
    install_kind: &'static str,
    logs_dir: String,
    data_dir: String,
    debug_build: bool,
}

#[tauri::command]
fn app_info(app: AppHandle) -> AppInfo {
    let path_str = |p: Result<PathBuf, tauri::Error>| {
        p.map(|p| p.to_string_lossy().replace('\\', "/")).unwrap_or_default()
    };
    AppInfo {
        version: env!("CARGO_PKG_VERSION"),
        tauri_version: tauri::VERSION,
        os: std::env::consts::OS,
        os_family: std::env::consts::FAMILY,
        arch: std::env::consts::ARCH,
        exe_path: std::env::current_exe()
            .map(|p| p.to_string_lossy().replace('\\', "/"))
            .unwrap_or_default(),
        install_kind: if better_installer_exe().is_some() {
            "BetterInstaller"
        } else if cfg!(debug_assertions) {
            "development"
        } else {
            "NSIS/MSI or portable"
        },
        logs_dir: path_str(app.path().app_log_dir()),
        data_dir: path_str(app.path().app_data_dir()),
        debug_build: cfg!(debug_assertions),
    }
}

/// Save a crash report written by the frontend; returns its full path.
#[tauri::command]
fn write_crash_log(app: AppHandle, content: String) -> CmdResult<String> {
    let path = logs_dir(&app)?.join(format!("crash-{}.log", timestamp()));
    fs::write(&path, content).map_err(err)?;
    prune_logs(&app, 30);
    Ok(path.to_string_lossy().replace('\\', "/"))
}

/// Panic reports left by earlier runs, newest first (name + content).
#[tauri::command]
fn read_panic_logs(app: AppHandle) -> Vec<(String, String)> {
    let Ok(dir) = logs_dir(&app) else { return Vec::new() };
    let mut logs: Vec<_> = fs::read_dir(dir)
        .map(|it| it.filter_map(|e| e.ok()).map(|e| e.path()).collect())
        .unwrap_or_else(|_| Vec::new());
    logs.retain(|p| {
        p.file_name()
            .and_then(|n| n.to_str())
            .is_some_and(|n| n.starts_with("panic-") && n.ends_with(".log"))
    });
    logs.sort();
    logs.reverse();
    logs.into_iter()
        .take(3)
        .filter_map(|p| {
            let name = p.file_name()?.to_string_lossy().into_owned();
            Some((name, fs::read_to_string(&p).ok()?))
        })
        .collect()
}

#[tauri::command]
fn open_logs_dir(app: AppHandle) -> CmdResult<()> {
    let dir = logs_dir(&app)?;
    app.opener().open_path(dir.to_string_lossy(), None::<&str>).map_err(err)
}

/// Keep only the newest `keep` crash/panic logs.
fn prune_logs(app: &AppHandle, keep: usize) {
    let Ok(dir) = logs_dir(app) else { return };
    let mut logs: Vec<PathBuf> = fs::read_dir(dir)
        .map(|it| it.filter_map(|e| e.ok()).map(|e| e.path()).collect())
        .unwrap_or_default();
    logs.retain(|p| p.extension().is_some_and(|e| e == "log"));
    logs.sort_by_key(|p| p.file_name().map(|n| n.to_owned()));
    let excess = logs.len().saturating_sub(keep);
    for p in logs.into_iter().take(excess) {
        let _ = fs::remove_file(p);
    }
}

/* ── BetterInstaller updater ─────────────────────────────────────── */

const APP_ID: &str = "com.bettersoundmaker.app";

/// The BetterInstaller maintenance exe, only when this copy was installed by it.
///
/// Tauri's NSIS bundle also leaves an `uninstall.exe` beside the app, so the
/// exe alone proves nothing: BetterInstaller writes `uninstall-info.json`
/// with our app id, NSIS never does.
fn better_installer_exe() -> Option<PathBuf> {
    let dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    let info: serde_json::Value =
        serde_json::from_slice(&fs::read(dir.join("uninstall-info.json")).ok()?).ok()?;
    if info["app_id"].as_str() != Some(APP_ID) {
        return None;
    }
    let exe = dir.join(if cfg!(windows) { "uninstall.exe" } else { "uninstall" });
    exe.is_file().then_some(exe)
}

/// `uninstall.exe --check-update`. Null when this is not a BetterInstaller
/// install (the frontend then uses the Tauri updater); otherwise its JSON
/// report, with `error` set when the check failed (exit code 2).
#[tauri::command]
async fn bi_check_update() -> CmdResult<Option<serde_json::Value>> {
    let Some(exe) = better_installer_exe() else {
        return Ok(None);
    };
    let out = tauri::async_runtime::spawn_blocking(move || {
        let mut cmd = std::process::Command::new(exe);
        cmd.arg("--check-update");
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
        }
        cmd.output()
    })
    .await
    .map_err(err)?
    .map_err(err)?;

    let mut report: serde_json::Value = serde_json::from_slice(&out.stdout)
        .unwrap_or_else(|_| serde_json::json!({ "update_available": false }));
    if out.status.code() == Some(2) && report.get("error").is_none() {
        report["error"] = "BetterInstaller check failed".into();
    }
    Ok(Some(report))
}

/// Hand over to `uninstall.exe --update`: it waits for this process to exit,
/// applies the signed update with rollback, then relaunches the app.
#[tauri::command]
fn bi_apply_update(app: AppHandle) -> CmdResult<()> {
    let exe = better_installer_exe().ok_or("not a BetterInstaller install")?;
    std::process::Command::new(exe)
        .args(["--update", "--wait-pid", &std::process::id().to_string(), "--launch"])
        .spawn()
        .map_err(err)?;
    app.exit(0);
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if let Ok(dir) = app.path().app_log_dir() {
                install_panic_hook(dir);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            select_directory,
            write_file,
            write_buffer,
            mkdir,
            read_file,
            read_text_file,
            read_dir,
            exists,
            scan_sdefs,
            get_app_path,
            get_user_home,
            open_path,
            bi_check_update,
            encode_ogg,
            find_dcs_wave,
            detect_dcs_installs,
            index_dcs_waves,
            app_info,
            write_crash_log,
            read_panic_logs,
            open_logs_dir,
            bi_apply_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Better Sound.Maker");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn waves_are_extracted_and_normalized() {
        let sdef = "wave = \"\\\\Aircrafts\\\\F18\\\\eng.wav\"\n  wave=\"/a/b.ogg\"\ngain = 1";
        assert_eq!(parse_waves(sdef), vec!["Aircrafts/F18/eng.wav", "a/b.ogg"]);
    }

    #[test]
    fn vorbis_encoding_produces_an_ogg_stream() {
        let tone: Vec<f32> = (0..44_100).map(|i| (i as f32 * 0.0627).sin() * 0.5).collect();
        let ogg = encode_vorbis(&[&tone, &tone], 44_100, 0.5).unwrap();
        assert_eq!(&ogg[..4], b"OggS");
        assert!(ogg.windows(6).any(|w| w == b"vorbis"));
        assert!(ogg.len() < tone.len() * 2 * 2, "should be smaller than 16-bit PCM");
    }

    #[test]
    fn timestamp_is_sortable_utc() {
        let ts = timestamp();
        assert_eq!(ts.len(), 15);
        assert!(ts.starts_with("20"));
        assert_eq!(&ts[8..9], "-");
    }

    /// Runs only where a DCS install exists (developer machines).
    #[test]
    fn finds_dcs_and_a_module_wave() {
        let installs = tauri::async_runtime::block_on(detect_dcs_installs());
        let Some(first) = installs.first() else { return };
        eprintln!("DCS found: {}", first.path);
        let hit = tauri::async_runtime::block_on(find_dcs_wave(
            first.path.clone(),
            "Effects/Aircrafts/Engines/F14_Afterburner_Start_Int_01".into(),
        ));
        assert!(hit.is_some_and(|p| p.ends_with(".wav")), "AJS37 sound should resolve in {}", first.path);
    }

    #[test]
    fn indexes_readable_dcs_waves() {
        let installs = tauri::async_runtime::block_on(detect_dcs_installs());
        let Some(first) = installs.first() else { return };
        let idx = tauri::async_runtime::block_on(index_dcs_waves(first.path.clone()));
        eprintln!("readable DCS waves: {}", idx.len());
        assert!(idx.contains_key("aircrafts/engines/f14_afterburner_start_int_01"));
    }

    #[test]
    fn percent_decoding() {
        assert_eq!(percent_decode("C%3A%2FSaved%20Games%2F%C3%A9.wav"), "C:/Saved Games/é.wav");
        assert_eq!(percent_decode("100%"), "100%");
    }
}
