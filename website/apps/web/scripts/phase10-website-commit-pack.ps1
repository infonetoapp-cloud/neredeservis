param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$slug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$latestPath = Join-Path $planDir "134_phase10_website_commit_pack_latest.md"
$snapshotPath = Join-Path $planDir ("134_phase10_website_commit_pack_" + $slug + ".md")

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
$lineList.Add("git commit -m 'website: phase10 stabilization pack + env/admin gating'") | Out-Null
$lineList.Add('```') | Out-Null
$lineList.Add("") | Out-Null
$lineList.Add("Not: Bu paket app tarafina dokunmaz. App-impact register dosyasinda web-only not_required disiplini korunur.") | Out-Null

Set-Content -Path $latestPath -Value $lineList -Encoding ascii
Set-Content -Path $snapshotPath -Value $lineList -Encoding ascii

Write-Host ("[PHASE10-COMMIT-PACK] latest -> " + $latestPath) -ForegroundColor Green
Write-Host ("[PHASE10-COMMIT-PACK] snapshot -> " + $snapshotPath) -ForegroundColor Green

exit 0
