param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$slug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$latestPath = Join-Path $planDir "134_phase10_website_commit_pack_latest.md"
$snapshotPath = Join-Path $planDir ("134_phase10_website_commit_pack_" + $slug + ".md")

function Try-WriteFileWithRetry {
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
      return $true
    } catch {
      if ($i -eq $Attempts) {
        return $false
      }
      Start-Sleep -Milliseconds $DelayMs
    }
  }
  return $false
}

Push-Location $repoRoot
try {
  $statusLines = git status --porcelain
} finally {
  Pop-Location
}

$websiteRows = New-Object System.Collections.Generic.List[object]
foreach ($line in $statusLines) {
  if ([string]::IsNullOrWhiteSpace($line) -or $line.Length -lt 4) {
    continue
  }

  $rawStatus = $line.Substring(0, 2)
  $path = $line.Substring(3).Trim()
  if ($path.StartsWith("website/")) {
    $websiteRows.Add([PSCustomObject]@{
        Status = $rawStatus.Trim()
        Path = $path
      }) | Out-Null
  }
}

$lineList = New-Object System.Collections.Generic.List[string]
$lineList.Add("# Faz 10 Website Commit Pack") | Out-Null
$lineList.Add("") | Out-Null
$lineList.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lineList.Add("Durum: " + $(if ($websiteRows.Count -gt 0) { "READY" } else { "EMPTY" })) | Out-Null
$lineList.Add("Toplam website degisiklik: " + $websiteRows.Count) | Out-Null
$lineList.Add("") | Out-Null

if ($websiteRows.Count -gt 0) {
  $lineList.Add("## Degisiklik Listesi") | Out-Null
  $lineList.Add("| Status | Path |") | Out-Null
  $lineList.Add("| --- | --- |") | Out-Null
  foreach ($row in $websiteRows) {
    $lineList.Add("| " + $row.Status + " | " + $row.Path + " |") | Out-Null
  }
  $lineList.Add("") | Out-Null
}

$lineList.Add("## Commit Komutlari (website-only)") | Out-Null
$lineList.Add('```powershell') | Out-Null
$lineList.Add("git add website") | Out-Null
$lineList.Add("git commit -m 'website: update phase scripts, reports, and web parity docs'") | Out-Null
$lineList.Add('```') | Out-Null
$lineList.Add("") | Out-Null
$lineList.Add("Not: Bu paket app tarafina dokunmaz. App-impact register dosyasinda web-only not_required disiplini korunur.") | Out-Null

$latestWriteOk = Try-WriteFileWithRetry -Path $latestPath -Value $lineList
if (-not $latestWriteOk) {
  Write-Warning ("[PHASE10-COMMIT-PACK] latest file lock edildi: " + $latestPath)
}

$snapshotWriteOk = Try-WriteFileWithRetry -Path $snapshotPath -Value $lineList
if (-not $snapshotWriteOk) {
  throw ("[PHASE10-COMMIT-PACK] snapshot yazilamadi: " + $snapshotPath)
}

Write-Host ("[PHASE10-COMMIT-PACK] latest -> " + $latestPath) -ForegroundColor Green
Write-Host ("[PHASE10-COMMIT-PACK] snapshot -> " + $snapshotPath) -ForegroundColor Green

exit 0
