<#
.SYNOPSIS
  Builds every Better Sound.Maker release asset into ./release.

  BetterInstaller setup (primary)   Better.Sound.Maker.Setup.<v>.exe  + bsm.bpkg + update.json
  NSIS / MSI (backup installers)    Better.Sound.Maker_<v>_x64-nsis-setup.exe / _x64.msi (+ .sig)
  Tauri updater manifest            latest.json

  Updates: a BetterInstaller install updates through update.json; NSIS/MSI installs
  (and BetterInstaller installs whose check fails) through latest.json.

.PARAMETER BetterInstallerDir
  BetterInstaller checkout holding target/release/bpkg.exe and betterinstaller.exe
  (built with: cargo build --release -p bpkg-cli -p installer). Default: $env:BSM_BETTERINSTALLER,
  else ../BetterModsManager/BetterInstaller.

.PARAMETER Notes
  Release notes shown by both updaters.

.NOTES
  Signing keys never live in the repo:
    Tauri updater   $env:TAURI_SIGNING_PRIVATE_KEY, else ~/.tauri/better-sound-maker.key
    BetterInstaller $env:BSM_BI_PRIVATE_KEY_FILE,  else ~/.betterinstaller/better-sound-maker/private.key
  update.json is signed for 7 days: renew it between releases with
    bpkg resign-manifest update.json --key <private.key>   (then re-upload it to the latest release)
#>
param(
    [string]$BetterInstallerDir = $(if ($env:BSM_BETTERINSTALLER) { $env:BSM_BETTERINSTALLER } else { "../BetterModsManager/BetterInstaller" }),
    [string]$Notes = "",
    [switch]$SkipTauriBuild
)
$ErrorActionPreference = "Stop"
# Native tools write progress to stderr; failures are detected by exit code instead.
$PSNativeCommandUseErrorActionPreference = $false
$utf8 = New-Object System.Text.UTF8Encoding $false
function Read-Utf8($path) { [IO.File]::ReadAllText((Resolve-Path $path), $utf8) }
function Write-Utf8($path, $text) { [IO.File]::WriteAllText($path, $text, $utf8) }
function Invoke-Native {
    $ErrorActionPreference = "Continue"
    & $args[0] @($args | Select-Object -Skip 1) 2>&1 | ForEach-Object { "$_" }
    if ($LASTEXITCODE -ne 0) { throw "$($args[0]) failed (exit $LASTEXITCODE)" }
}
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $root

$repo    = "FreeProject089/Better-Sound.Maker"
$version = (Read-Utf8 "$root/package.json" | ConvertFrom-Json).version
$tag     = $version                     # releases are tagged without a "v" prefix
$dlBase  = "https://github.com/$repo/releases/download/$tag"
if (-not $Notes) { $Notes = "Better Sound.Maker $version" }

$relDir  = Join-Path $root "release"
$payload = Join-Path $root "src-tauri/target/bi-payload"
$tauriRel = Join-Path $root "src-tauri/target/release"
$config  = Join-Path $root "installer/installer.toml"

$biDir = Resolve-Path $BetterInstallerDir
$bpkg  = Join-Path $biDir "target/release/bpkg.exe"
$inst  = Join-Path $biDir "target/release/betterinstaller.exe"

$tauriKeyFile = Join-Path $HOME ".tauri/better-sound-maker.key"
$biKey = if ($env:BSM_BI_PRIVATE_KEY_FILE) { $env:BSM_BI_PRIVATE_KEY_FILE } else { Join-Path $HOME ".betterinstaller/better-sound-maker/private.key" }
if (-not (Test-Path $biKey)) { throw "BetterInstaller private key not found: $biKey" }

Write-Host "Better Sound.Maker $version" -ForegroundColor Cyan

# ── 1. Versions ─────────────────────────────────────────────────────
Write-Host "[1/6] Syncing version $version..."
foreach ($f in @($config, (Join-Path $root "src-tauri/Cargo.toml"))) {
    $text = Read-Utf8 $f
    $synced = ([regex]'(?m)^(version\s*=\s*")[^"]+(")').Replace($text, "`${1}$version`${2}", 1)
    if ($synced -ne $text) { Write-Utf8 $f $synced }
}

# ── 2. Tauri build (exe + NSIS + MSI + updater signatures) ──────────
if (-not $SkipTauriBuild) {
    Write-Host "[2/6] Building the app (Tauri: NSIS + MSI)..."
    if (-not $env:TAURI_SIGNING_PRIVATE_KEY) {
        if (-not (Test-Path $tauriKeyFile)) { throw "Tauri signing key not found: $tauriKeyFile" }
        $env:TAURI_SIGNING_PRIVATE_KEY = (Read-Utf8 $tauriKeyFile).Trim()
        if (-not $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD) { $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "" }
    }
    Invoke-Native npx.cmd tauri build | Where-Object { $_ -notmatch '^\s*(Compiling|Downloaded|Downloading)' }
} else {
    Write-Host "[2/6] Skipping Tauri build (-SkipTauriBuild)"
}

if (Test-Path $relDir) { Remove-Item -Recurse -Force $relDir }
New-Item -ItemType Directory -Force $relDir | Out-Null

# ── 3. Backup installers + Tauri latest.json ────────────────────────
Write-Host "[3/6] Collecting NSIS / MSI and writing latest.json..."
$nsis = Get-Item (Join-Path $tauriRel "bundle/nsis/*_$($version)_x64-setup.exe")
$msi  = Get-Item (Join-Path $tauriRel "bundle/msi/*_$($version)_x64_*.msi")
$nsisName = "Better.Sound.Maker_$($version)_x64-nsis-setup.exe"
$msiName  = "Better.Sound.Maker_$($version)_x64.msi"
Copy-Item $nsis.FullName (Join-Path $relDir $nsisName)
Copy-Item "$($nsis.FullName).sig" (Join-Path $relDir "$nsisName.sig")
Copy-Item $msi.FullName (Join-Path $relDir $msiName)
Copy-Item "$($msi.FullName).sig" (Join-Path $relDir "$msiName.sig")

$nsisEntry = [ordered]@{ signature = (Read-Utf8 "$($nsis.FullName).sig").Trim(); url = "$dlBase/$nsisName" }
$msiEntry  = [ordered]@{ signature = (Read-Utf8 "$($msi.FullName).sig").Trim();  url = "$dlBase/$msiName" }
$latest = [ordered]@{
    version   = $version
    notes     = $Notes
    pub_date  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    platforms = [ordered]@{
        "windows-x86_64"      = $nsisEntry   # NSIS installs and any install that does not say
        "windows-x86_64-nsis" = $nsisEntry
        "windows-x86_64-msi"  = $msiEntry
    }
}
Write-Utf8 (Join-Path $relDir "latest.json") ($latest | ConvertTo-Json -Depth 5)

# ── 4. BetterInstaller payload ──────────────────────────────────────
Write-Host "[4/6] Assembling the BetterInstaller payload..."
if (-not (Test-Path $bpkg) -or -not (Test-Path $inst)) {
    Write-Host "      engine not built -> cargo build in $biDir"
    Push-Location $biDir
    $env:BI_ICON = (Resolve-Path (Join-Path $root "src-tauri/icons/icon.ico")).Path
    try { Invoke-Native cargo build --release -p bpkg-cli -p installer } finally { Pop-Location }
}
if (Test-Path $payload) { Remove-Item -Recurse -Force $payload }
New-Item -ItemType Directory -Force $payload | Out-Null
Copy-Item (Join-Path $tauriRel "better-sound-maker.exe") $payload
# Bundled resources, at the same relative paths as in tauri.conf.json > bundle.resources
foreach ($r in @("LICENSE", "Update", "public")) {
    Copy-Item -Recurse (Join-Path $tauriRel $r) (Join-Path $payload $r)
}
New-Item -ItemType Directory -Force (Join-Path $payload "assets") | Out-Null
Copy-Item (Join-Path $root "src-tauri/icons/128x128.png") (Join-Path $payload "assets/logo.png")

# ── 5. Pack, sign, stamp the setup ──────────────────────────────────
Write-Host "[5/6] Packing and signing bsm.bpkg..."
$pkg   = Join-Path $relDir "bsm.bpkg"
$setup = Join-Path $relDir "Better.Sound.Maker.Setup.$version.exe"
Invoke-Native $bpkg pack --root $payload --config $config --out $pkg
Invoke-Native $bpkg sign --key $biKey $pkg
Invoke-Native $bpkg build --installer $inst --config $config --package $pkg --out $setup

# ── 6. Signed update.json ───────────────────────────────────────────
Write-Host "[6/6] Writing the signed update.json..."
Invoke-Native $bpkg update-manifest --package $pkg --config $config --key $biKey `
    --url "$dlBase/bsm.bpkg" --notes $Notes --out (Join-Path $relDir "update.json")
Invoke-Native $bpkg verify-manifest (Join-Path $relDir "update.json") --key (Join-Path (Split-Path $biKey) "public.key")

Write-Host ""
Write-Host "Release assets in $relDir :" -ForegroundColor Green
Get-ChildItem $relDir | ForEach-Object { "  {0,-48} {1,8:N1} MB" -f $_.Name, ($_.Length / 1MB) }
Write-Host ""
Write-Host "Publish (all files are required by one of the two updaters):"
Write-Host "  gh release create $tag release/* --repo $repo --title `"$version`" --notes-file <notes.md>"
