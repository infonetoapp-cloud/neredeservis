param(
  [switch]$Apply,
  [int]$KeepPerPattern = 2
)

$ErrorActionPreference = "Stop"

if ($KeepPerPattern -lt 1) {
  throw "KeepPerPattern must be >= 1."
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$patterns = @(
  "87_phase5_manual_smoke_probe_*.md",
  "89_phase5_stg_domain_dns_check_*.md",
  "130_phase10_manual_release_window_*.md",
  "132_phase10_post_release_observe_*.md",
  "133_phase10_stabilization_pack_*.md",
  "134_phase10_website_commit_pack_*.md"
)

$timestamp = Get-Date
$slug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$latestPath = Join-Path $planDir "135_phase10_report_prune_latest.md"
$snapshotPath = Join-Path $planDir ("135_phase10_report_prune_" + $slug + ".md")

$toDelete = New-Object System.Collections.Generic.List[System.IO.FileInfo]
$summaryRows = New-Object System.Collections.Generic.List[object]

foreach ($pattern in $patterns) {
  $files = Get-ChildItem -Path (Join-Path $planDir $pattern) -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending

  $keep = @()
  if ($files.Count -gt 0) {
    $keep = $files | Select-Object -First $KeepPerPattern
  }
  $drop = @()
  if ($files.Count -gt $KeepPerPattern) {
    $drop = $files | Select-Object -Skip $KeepPerPattern
    foreach ($item in $drop) {
      $toDelete.Add($item) | Out-Null
    }
  }

  $summaryRows.Add([PSCustomObject]@{
      Pattern = $pattern
      Total = $files.Count
      Keep = $keep.Count
      Drop = $drop.Count
    }) | Out-Null
}

if ($Apply) {
  foreach ($file in $toDelete) {
    Remove-Item -Path $file.FullName -Force -ErrorAction Stop
  }
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 10 Report Prune") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $(if ($Apply) { "APPLIED" } else { "DRY_RUN" })) | Out-Null
$lines.Add("KeepPerPattern: " + $KeepPerPattern) | Out-Null
$lines.Add("Silinecek aday toplam: " + $toDelete.Count) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Pattern | Total | Keep | Drop |") | Out-Null
$lines.Add("| --- | --- | --- | --- |") | Out-Null
foreach ($row in $summaryRows) {
  $lines.Add("| " + $row.Pattern + " | " + $row.Total + " | " + $row.Keep + " | " + $row.Drop + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("Not: `*_latest.md` dosyalari bu prune desenlerine dahil degildir, korunur.") | Out-Null

Set-Content -Path $latestPath -Value $lines -Encoding ascii
Set-Content -Path $snapshotPath -Value $lines -Encoding ascii

Write-Host ("[PHASE10-PRUNE] latest -> " + $latestPath) -ForegroundColor Green
Write-Host ("[PHASE10-PRUNE] snapshot -> " + $snapshotPath) -ForegroundColor Green
Write-Host ("[PHASE10-PRUNE] candidates -> " + $toDelete.Count + " (apply=" + [bool]$Apply + ")") -ForegroundColor Yellow

exit 0
