param(
  [switch]$FailOnMissing,
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$diffPath = Join-Path $appImpactDir "04_api_contract_diff_register.md"
$checklistPath = Join-Path $appImpactDir "07_app_parser_mapping_checklist_2026_02_27.md"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$latestReportPath = Join-Path $planDir "105_phase9_parser_contract_packet_latest.md"
$snapshotReportPath = Join-Path $planDir ("105_phase9_parser_contract_packet_" + $dateSlug + ".md")

function Write-FileWithRetry {
  param(
    [string]$Path,
    [object]$Value,
    [string]$Encoding = "ascii",
    [int]$Attempts = 8,
    [int]$DelayMs = 250
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

$diffContent = Get-Content -Path $diffPath
$checklistContent = Get-Content -Path $checklistPath

$entries = New-Object System.Collections.Generic.List[object]
$current = $null

foreach ($line in $diffContent) {
  if ($line -match "^### API-DIFF-(\d+)") {
    if ($null -ne $current -and $current.Id -ge 1 -and $current.Id -le 24) {
      $entries.Add([pscustomobject]$current) | Out-Null
    }
    $current = @{
      Id = [int]$Matches[1]
      Endpoint = ""
      DiffType = ""
      Status = ""
      AppLayer = ""
    }
    continue
  }

  if ($null -eq $current) {
    continue
  }

  if ($line -match '^- `Endpoint/Action`:\s*(.+)$') {
    $current.Endpoint = $Matches[1].Trim()
    continue
  }
  if ($line -match '^- `Degisiklik Tipi`:\s*`?(.+?)`?$') {
    $current.DiffType = $Matches[1].Trim('`', ' ')
    continue
  }
  if ($line -match '^- `Ilgili App Layer`:\s*(.+)$') {
    $current.AppLayer = $Matches[1].Trim('`', ' ')
    continue
  }
  if ($line -match '^- `Durum`:\s*`?(.+?)`?$') {
    $current.Status = $Matches[1].Trim('`', ' ')
    continue
  }
}

if ($null -ne $current -and $current.Id -ge 1 -and $current.Id -le 24) {
  $entries.Add([pscustomobject]$current) | Out-Null
}

$orderedEntries = @($entries | Sort-Object Id)
$appPendingCount = @($orderedEntries | Where-Object { $_.Status -match "app-pending" }).Count

$errorCodes = New-Object System.Collections.Generic.List[string]
$inErrorSection = $false
foreach ($line in $checklistContent) {
  if ($line -match "^## 6\)") {
    $inErrorSection = $true
    continue
  }
  if ($line -match "^## 7\)") {
    $inErrorSection = $false
  }
  if (-not $inErrorSection) {
    continue
  }
  if ($line -match '^- \[[ xX]\] `([^`]+)`') {
    $errorCodes.Add($Matches[1]) | Out-Null
  }
}

$status = if ($orderedEntries.Count -ge 24 -and $errorCodes.Count -ge 11) { "PASS" } else { "FAIL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 Parser Contract Packet") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ozet") | Out-Null
$lines.Add('- Kontrat kaynagi: website/app-impact/04_api_contract_diff_register.md') | Out-Null
$lines.Add('- Paket kapsami: API-DIFF-001..024 (admin-only endpointler disarida)') | Out-Null
$lines.Add("- Cikarilan endpoint sayisi: " + $orderedEntries.Count) | Out-Null
$lines.Add("- App pending endpoint sayisi: " + $appPendingCount) | Out-Null
$lines.Add("- Error-code cekirdek seti: " + $errorCodes.Count) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Endpoint Paketi (App Parser Referansi)") | Out-Null
$lines.Add("| API-DIFF | Endpoint | Tip | Durum | App Layer |") | Out-Null
$lines.Add("| --- | --- | --- | --- | --- |") | Out-Null
foreach ($entry in $orderedEntries) {
  $lines.Add("| API-DIFF-" + ("{0:D3}" -f $entry.Id) + " | " + $entry.Endpoint + " | " + $entry.DiffType + " | " + $entry.Status + " | " + $entry.AppLayer + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("## Error Code Paketi (App Mapping Referansi)") | Out-Null
foreach ($code in $errorCodes) {
  $lines.Add("- " + $code) | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("## Notlar") | Out-Null
$lines.Add("- Bu rapor app parser/mapping sprintine kopyalanabilir endpoint paketidir.") | Out-Null
$lines.Add("- Durum FAIL ise API-DIFF veya checklist kaynaklarinda yapisal eksik vardir.") | Out-Null

Write-FileWithRetry -Path $latestReportPath -Value $lines
Write-Host ("[PHASE9-PACKET] latest -> " + $latestReportPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotReportPath -Value $lines
  Write-Host ("[PHASE9-PACKET] snapshot -> " + $snapshotReportPath) -ForegroundColor Green
}

if ($FailOnMissing -and $status -ne "PASS") {
  exit 4
}
exit 0
