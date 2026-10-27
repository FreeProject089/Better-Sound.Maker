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

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
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
    fn percent_decoding() {
        assert_eq!(percent_decode("C%3A%2FSaved%20Games%2F%C3%A9.wav"), "C:/Saved Games/é.wav");
        assert_eq!(percent_decode("100%"), "100%");
    }
}
