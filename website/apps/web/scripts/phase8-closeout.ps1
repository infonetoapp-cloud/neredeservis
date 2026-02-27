param(
  [switch]$SkipRemoteSmoke
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$webDir = (Resolve-Path (Join-Path $scriptDir "..")).Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("101_phase8_closeout_" + $dateSlug + ".md")

function Invoke-Step {
  param(
    [string]$Name,
    [string]$Command
  )

  Write-Host ("[PHASE8-CLOSEOUT] " + $Name + " -> " + $Command) -ForegroundColor Cyan

  $outFile = [System.IO.Path]::GetTempFileName()
  $cmd = "cmd /c `"" + $Command + " > `"" + $outFile + "`" 2>&1`""
  $null = Invoke-Expression $cmd
  $exitCode = $LASTEXITCODE
  $output = @()
  if (Test-Path $outFile) {
    $output = Get-Content -Path $outFile
    Remove-Item -Path $outFile -Force -ErrorAction SilentlyContinue
  }

  return [PSCustomObject]@{
    Name = $Name
    Command = $Command
    ExitCode = $exitCode
    Status = $(if ($exitCode -eq 0) { "PASS" } else { "FAIL" })
    Output = $output
  }
}

function Find-LatestReport {
  param([string]$Pattern)

  $file = Get-ChildItem -Path $planDir -Filter $Pattern -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  return $file
}

$results = New-Object System.Collections.Generic.List[object]

$results.Add((Invoke-Step -Name "phase8 readiness (local gate)" -Command "cd /d `"$webDir`" && npm.cmd run readiness:phase8")) | Out-Null

if ($SkipRemoteSmoke) {
  $results.Add([PSCustomObject]@{
      Name = "phase8 remote seo smoke"
      Command = "npm.cmd run smoke:phase8:seo"
      ExitCode = 0
      Status = "SKIPPED"
      Output = @("Skipped by flag: -SkipRemoteSmoke")
    }) | Out-Null
} else {
  $results.Add((
      Invoke-Step `
        -Name "phase8 remote seo smoke (strict)" `
        -Command "cd /d `"$webDir`" && powershell -ExecutionPolicy Bypass -File .\scripts\phase8-marketing-seo-smoke.ps1 -FailOnPartial"
    )) | Out-Null
}

$latestReadiness = Find-LatestReport -Pattern "100_phase8_readiness_*.md"
$latestLocalSmoke = Find-LatestReport -Pattern "99_phase8_local_seo_smoke_*.md"
$latestRemoteSmoke = Find-LatestReport -Pattern "98_phase8_marketing_seo_smoke_*.md"

$hasFail = @($results | Where-Object { $_.Status -eq "FAIL" }).Count -gt 0
$hasSkip = @($results | Where-Object { $_.Status -eq "SKIPPED" }).Count -gt 0

$status = if ($hasFail) {
  "PARTIAL"
} elseif ($hasSkip) {
  "PARTIAL"
} else {
  "PASS"
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 8 Closeout Report") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Step | Status | Exit |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
foreach ($result in $results) {
  $lines.Add("| " + $result.Name + " | " + $result.Status + " | " + $result.ExitCode + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("## Latest Linked Reports") | Out-Null
$lines.Add("- readiness: " + $(if ($latestReadiness) { "website/plan/" + $latestReadiness.Name } else { "BULUNAMADI" })) | Out-Null
$lines.Add("- local seo smoke: " + $(if ($latestLocalSmoke) { "website/plan/" + $latestLocalSmoke.Name } else { "BULUNAMADI" })) | Out-Null
$lines.Add("- remote seo smoke: " + $(if ($latestRemoteSmoke) { "website/plan/" + $latestRemoteSmoke.Name } else { "BULUNAMADI" })) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Closeout Notes") | Out-Null
$lines.Add("- Faz 8 PASS icin local readiness + remote smoke adimlarinin ikisi de PASS olmalidir.") | Out-Null
$lines.Add("- Remote smoke FAIL/PARTIAL ise tek deploy penceresinde canonical endpointler yeniden probe edilmelidir.") | Out-Null

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[PHASE8-CLOSEOUT] report -> " + $reportPath) -ForegroundColor Green

if ($status -eq "PASS") {
  exit 0
}
exit 3
