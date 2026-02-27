param(
  [switch]$Snapshot,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$webDir = (Resolve-Path (Join-Path $repoRoot "website\apps\web")).Path

$phase9CloseoutPath = Join-Path $planDir "106_phase9_closeout_latest.md"
$phase9CoreReadinessPath = Join-Path $planDir "104_phase9_cutover_core_readiness_latest.md"
$phase9WebReadinessPath = Join-Path $planDir "109_phase9_web_only_readiness_latest.md"
$queuePath = Join-Path $appImpactDir "06_core_app_parity_execution_queue_2026_02_27.md"

$latestPath = Join-Path $planDir "129_phase10_no_admin_readiness_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotPath = Join-Path $planDir ("129_phase10_no_admin_readiness_" + $dateSlug + ".md")

function Write-FileWithRetry {
  param(
    [string]$Path,
    [object]$Value,
    [string]$Encoding = "ascii",
    [int]$Attempts = 20,
    [int]$DelayMs = 500
  )
  for ($i = 1; $i -le $Attempts; $i++) {
    try {
      Set-Content -Path $Path -Value $Value -Encoding $Encoding
      return
    } catch {
      if ($i -eq $Attempts) {
        throw
      }
      Start-Sleep -Milliseconds $DelayMs
    }
  }
}

function Resolve-MdStatus {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    return "MISSING"
  }
  $raw = Get-Content -Path $Path -Raw
  $match = [regex]::Match($raw, "(?m)^Durum:\s*([A-Z_]+)")
  if (-not $match.Success) {
    return "UNKNOWN"
  }
  return $match.Groups[1].Value
}

$checks = New-Object System.Collections.Generic.List[object]

function Add-Check {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Evidence
  )
  $checks.Add([pscustomobject]@{
    name = $Name
    status = $Status
    evidence = $Evidence
  }) | Out-Null
}

$closeoutStatus = Resolve-MdStatus -Path $phase9CloseoutPath
Add-Check -Name "Faz 9 closeout durumu" -Status $(if ($closeoutStatus -eq "PASS") { "PASS" } else { "FAIL" }) -Evidence ("106: " + $closeoutStatus)

$coreStatus = Resolve-MdStatus -Path $phase9CoreReadinessPath
Add-Check -Name "Faz 9 core readiness" -Status $(if ($coreStatus -eq "PASS") { "PASS" } else { "FAIL" }) -Evidence ("104: " + $coreStatus)

$webStatus = Resolve-MdStatus -Path $phase9WebReadinessPath
Add-Check -Name "Faz 9 web-only readiness" -Status $(if ($webStatus -eq "PASS") { "PASS" } else { "FAIL" }) -Evidence ("109: " + $webStatus)

$queueStatus = "FAIL"
$queueEvidence = "queue dosyasi yok"
if (Test-Path $queuePath) {
  $queueRaw = Get-Content -Path $queuePath -Raw
  $hasOpen = [regex]::IsMatch($queueRaw, "app_(pending|partial|blocked)|app pending|app partial|app blocked")
  if (-not $hasOpen) {
    $queueStatus = "PASS"
    $queueEvidence = "app pending/partial/blocked kalemi yok"
  } else {
    $queueStatus = "FAIL"
    $queueEvidence = "queue icinde acik app durumu bulundu"
  }
}
Add-Check -Name "App parity queue temizligi" -Status $queueStatus -Evidence $queueEvidence

if ($SkipBuild) {
  Add-Check -Name "Web lint/build" -Status "SKIPPED" -Evidence "SkipBuild aktif"
} else {
  Push-Location $webDir
  try {
    & npm run lint | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Add-Check -Name "Web lint/build" -Status "FAIL" -Evidence "npm run lint"
    } else {
      & npm run build | Out-Null
      if ($LASTEXITCODE -ne 0) {
        Add-Check -Name "Web lint/build" -Status "FAIL" -Evidence "npm run build"
      } else {
        Add-Check -Name "Web lint/build" -Status "PASS" -Evidence "npm run lint + npm run build"
      }
    }
  } finally {
    Pop-Location
  }
}

$hasFail = @($checks | Where-Object { $_.status -eq "FAIL" }).Count -gt 0
$overall = if ($hasFail) { "PARTIAL" } else { "PASS" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 10 No-Admin Readiness") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kontrol Sonuclari") | Out-Null
$lines.Add("| Kontrol | Durum | Kanit |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
foreach ($check in $checks) {
  $lines.Add("| " + $check.name + " | " + $check.status + " | " + $check.evidence + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("## Sonraki 4 Adim") | Out-Null
if ($overall -eq "PASS") {
  $lines.Add("1. Faz 10 kapsaminda adminsiz release-candidate akisini dondur ve feature drift engeli uygula.") | Out-Null
  $lines.Add("2. Deploy butce politikasina uygun tek pencerede STG ve PROD smoke al.") | Out-Null
  $lines.Add("3. App-impact register'da yeni web degisikliklerinde not_required disiplinini koru.") | Out-Null
  $lines.Add("4. Sonraki faz kapsamini (admin haric) write-path kalite ve izlenebilirlik odaginda ac.") | Out-Null
} else {
  $lines.Add("1. FAIL olan kontrolleri kapat ve komutu tekrar kos.") | Out-Null
  $lines.Add("2. Faz 9 PASS sinyalini bozacak acik app parity kalemi birakma.") | Out-Null
  $lines.Add("3. Web lint/build adimlarini yesile cekmeden deploy penceresi acma.") | Out-Null
  $lines.Add("4. `npm run readiness:phase10:no-admin` tekrar kos ve latest raporu guncelle.") | Out-Null
}

Write-FileWithRetry -Path $latestPath -Value $lines
Write-Host ("[PHASE10-NO-ADMIN-READINESS] latest -> " + $latestPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotPath -Value $lines
  Write-Host ("[PHASE10-NO-ADMIN-READINESS] snapshot -> " + $snapshotPath) -ForegroundColor Green
}

exit 0
