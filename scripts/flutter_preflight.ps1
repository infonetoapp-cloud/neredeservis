param(
  [switch]$Strict
)

$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

function Read-JsonFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return $null
  }

  $raw = Get-Content -Path $Path -Raw
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return $null
  }

  return $raw | ConvertFrom-Json
}

function Get-FlutterMachineVersion {
  param([string]$FlutterCommand)

  try {
    $output = & $FlutterCommand --version --machine 2>$null
    $json = ($output | Out-String).Trim()
    if (-not [string]::IsNullOrWhiteSpace($json)) {
      return ($json | ConvertFrom-Json)
    }
  } catch {
    return $null
  }

  return $null
}

$repoRoot = Get-RepoRoot
$fvmConfigPath = Join-Path $repoRoot '.fvm\fvm_config.json'
$fvmRcPath = Join-Path $repoRoot '.fvmrc'
$localFlutterPath = Join-Path $repoRoot '.fvm\flutter_sdk\bin\flutter.bat'

Write-Host "== NeredeServis Flutter Preflight =="
Write-Host "Repo root: $repoRoot"

$fvmConfig = Read-JsonFile -Path $fvmConfigPath
$fvmRc = Read-JsonFile -Path $fvmRcPath

if ($null -eq $fvmConfig) {
  throw "Missing or unreadable .fvm\fvm_config.json"
}

if (-not (Test-Path $localFlutterPath)) {
  throw "Missing local Flutter SDK: $localFlutterPath"
}

$pinnedVersion = $fvmConfig.flutterSdkVersion
if ([string]::IsNullOrWhiteSpace($pinnedVersion)) {
  throw "Pinned version not found in .fvm\fvm_config.json"
}

$fvmRcVersion = $null
if ($null -ne $fvmRc -and $fvmRc.PSObject.Properties.Name -contains 'flutter') {
  $fvmRcVersion = [string]$fvmRc.flutter
}

$localInfo = Get-FlutterMachineVersion -FlutterCommand $localFlutterPath
if ($null -eq $localInfo) {
  throw "Failed to read local Flutter version from $localFlutterPath"
}

Write-Host "Pinned (.fvm/fvm_config.json): $pinnedVersion"
if (-not [string]::IsNullOrWhiteSpace($fvmRcVersion)) {
  Write-Host "Pinned (.fvmrc): $fvmRcVersion"
}
Write-Host "Local SDK version: $($localInfo.frameworkVersion)"
Write-Host "Local Dart version: $($localInfo.dartSdkVersion)"

$hasGlobalFlutter = $null -ne (Get-Command flutter -ErrorAction SilentlyContinue)
$globalMismatch = $false

if ($hasGlobalFlutter) {
  $globalInfo = Get-FlutterMachineVersion -FlutterCommand 'flutter'
  if ($null -ne $globalInfo) {
    Write-Host "Global Flutter version: $($globalInfo.frameworkVersion)"
    Write-Host "Global Dart version: $($globalInfo.dartSdkVersion)"
    if ($globalInfo.frameworkVersion -ne $pinnedVersion) {
      $globalMismatch = $true
      Write-Warning "Global Flutter version does not match pinned .fvm version."
    }
  } else {
    Write-Warning "Global flutter exists but version could not be parsed with --machine."
  }
} else {
  Write-Host "Global Flutter: not found on PATH (ok if local .fvm is used)."
}

if ($localInfo.frameworkVersion -ne $pinnedVersion) {
  throw "Local .fvm Flutter version ($($localInfo.frameworkVersion)) does not match pinned version ($pinnedVersion)."
}

if (-not [string]::IsNullOrWhiteSpace($fvmRcVersion) -and $fvmRcVersion -ne $pinnedVersion) {
  throw ".fvmrc version ($fvmRcVersion) does not match .fvm/fvm_config.json version ($pinnedVersion)."
}

if ($Strict -and $globalMismatch) {
  throw "Strict mode failed because global Flutter differs from pinned .fvm version."
}

Write-Host "Preflight result: PASS (local .fvm SDK is valid)"
