param(
  [string]$StgBaseUrl = "https://stg-app.neredeservis.app",
  [string]$ProdBaseUrl = "https://app.neredeservis.app",
  [string]$StgDomain = "stg-app.neredeservis.app",
  [string]$VercelScope = "infonetoapp-clouds-projects",
  [switch]$RefreshReadiness,
  [switch]$SkipStgDnsCheck
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$phase10ReadinessScript = Join-Path $scriptDir "phase10-no-admin-readiness.ps1"
$manualSmokeScript = Join-Path $scriptDir "phase5-manual-smoke-probe.ps1"
$stgDnsScript = Join-Path $scriptDir "phase5-stg-domain-dns-check.ps1"

$phase10ReadinessReport = Join-Path $planDir "129_phase10_no_admin_readiness_latest.md"
$latestPath = Join-Path $planDir "130_phase10_manual_release_window_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotPath = Join-Path $planDir ("130_phase10_manual_release_window_" + $dateSlug + ".md")

function Write-FileWithRetry {
  param(
    [string]$Path,
    [object]$Value,
    [string]$Encoding = "ascii",
    [int]$Attempts = 30,
    [int]$DelayMs = 600
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

function Read-MdStatus {
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

function Add-Check {
  param(
    [System.Collections.Generic.List[object]]$Rows,
    [string]$Name,
    [string]$Status,
    [string]$Evidence
  )
  $Rows.Add([pscustomobject]@{
    name = $Name
    status = $Status
    evidence = $Evidence
  }) | Out-Null
}

if ($RefreshReadiness) {
  & $phase10ReadinessScript
}

$rows = New-Object System.Collections.Generic.List[object]

$readinessStatus = Read-MdStatus -Path $phase10ReadinessReport
Add-Check -Rows $rows -Name "Faz 10 no-admin readiness" -Status $(if ($readinessStatus -eq "PASS") { "PASS" } else { "PARTIAL" }) -Evidence ("129: " + $readinessStatus)

& $manualSmokeScript -StgBaseUrl $StgBaseUrl -ProdBaseUrl $ProdBaseUrl

$latestSmoke = Get-ChildItem -Path $planDir -Filter "87_phase5_manual_smoke_probe_*.md" -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
$smokeStatus = "MISSING"
$smokeEvidence = "smoke raporu bulunamadi"
if ($latestSmoke) {
  $smokeStatus = Read-MdStatus -Path $latestSmoke.FullName
  $smokeEvidence = $latestSmoke.Name + " (" + $smokeStatus + ")"
}
Add-Check -Rows $rows -Name "STG+PROD manual smoke probe" -Status $(if ($smokeStatus -eq "PASS") { "PASS" } else { "PARTIAL" }) -Evidence $smokeEvidence

if ($SkipStgDnsCheck) {
  Add-Check -Rows $rows -Name "STG domain DNS check" -Status "SKIPPED" -Evidence "SkipStgDnsCheck aktif"
} else {
  $dnsStatus = "PARTIAL"
  $dnsEvidence = "phase5 dns check calismadi"
  try {
    & $stgDnsScript -Domain $StgDomain -Scope $VercelScope
    $dnsStatus = "PASS"
    $latestDns = Get-ChildItem -Path $planDir -Filter "89_phase5_stg_domain_dns_check_*.md" -File -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1
    if ($latestDns) {
      $dnsEvidence = $latestDns.Name
    } else {
      $dnsEvidence = "dns check pass"
    }
  } catch {
    $latestDns = Get-ChildItem -Path $planDir -Filter "89_phase5_stg_domain_dns_check_*.md" -File -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1
    if ($latestDns) {
      $dnsEvidence = $latestDns.Name + " (non-pass)"
    } else {
      $dnsEvidence = $_.Exception.Message
    }
  }
  Add-Check -Rows $rows -Name "STG domain DNS check" -Status $dnsStatus -Evidence $dnsEvidence
}

$deployPolicyPath = Join-Path $planDir "79_vercel_deploy_budget_policy.md"
Add-Check -Rows $rows -Name "Deploy budget policy kaydi" -Status $(if (Test-Path $deployPolicyPath) { "PASS" } else { "PARTIAL" }) -Evidence "79_vercel_deploy_budget_policy.md"

$overall = if (@($rows | Where-Object { $_.status -eq "PARTIAL" -or $_.status -eq "FAIL" }).Count -eq 0) { "PASS" } else { "PARTIAL" }
$openChecks = @($rows | Where-Object { $_.status -eq "PARTIAL" -or $_.status -eq "FAIL" } | Select-Object -ExpandProperty name)
$openChecksText = if ($openChecks.Count -gt 0) { ($openChecks -join ", ") } else { "-" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 10 Manual Release Window Pack") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kontrol Sonuclari") | Out-Null
$lines.Add("| Kontrol | Durum | Kanit |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
foreach ($row in $rows) {
  $lines.Add("| " + $row.name + " | " + $row.status + " | " + $row.evidence + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("## Sonraki 4 Adim") | Out-Null
if ($overall -eq "PASS") {
  $lines.Add("1. Tek deploy penceresinde STG ve PROD release notunu sabitle.") | Out-Null
  $lines.Add("2. Release sonrasi 30 dakika smoke/probe gozlem turu uygula.") | Out-Null
  $lines.Add("3. App-impact kayitlarinda yeni web degisikliklerini not_required disipliniyle islemeye devam et.") | Out-Null
  $lines.Add("4. Faz 10 closeout raporunu final karar belgesine bagla.") | Out-Null
} else {
  $lines.Add("1. PARTIAL kalan kontrolleri kapat: " + $openChecksText + ".") | Out-Null
  $lines.Add("2. npm run pack:phase10:manual-release-window komutunu tekrar kos.") | Out-Null
  $lines.Add("3. Deploy penceresini PASS raporu olmadan acma.") | Out-Null
  $lines.Add("4. Faz 10 closeout oncesi 129 + 130 raporlarini tekrar dogrula.") | Out-Null
}

Write-FileWithRetry -Path $latestPath -Value $lines
Write-Host ("[PHASE10-MANUAL-RELEASE] latest -> " + $latestPath) -ForegroundColor Green

Write-FileWithRetry -Path $snapshotPath -Value $lines
Write-Host ("[PHASE10-MANUAL-RELEASE] snapshot -> " + $snapshotPath) -ForegroundColor Green

exit 0
