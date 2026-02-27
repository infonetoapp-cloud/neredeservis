param(
  [switch]$IncludeRemoteSmoke
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$webDir = (Resolve-Path (Join-Path $scriptDir "..")).Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("100_phase8_readiness_" + $dateSlug + ".md")

function Invoke-Step {
  param(
    [string]$Name,
    [string]$Command
  )

  Write-Host ("[PHASE8-READINESS] " + $Name + " -> " + $Command) -ForegroundColor Cyan

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

$results.Add((Invoke-Step -Name "web lint" -Command "cd /d `"$webDir`" && npm.cmd run lint")) | Out-Null
$results.Add((Invoke-Step -Name "web build" -Command "cd /d `"$webDir`" && npm.cmd run build")) | Out-Null
$results.Add((Invoke-Step -Name "phase8 local seo smoke" -Command "cd /d `"$webDir`" && npm.cmd run smoke:phase8:local")) | Out-Null

if ($IncludeRemoteSmoke) {
  $results.Add((Invoke-Step -Name "phase8 remote seo smoke" -Command "cd /d `"$webDir`" && npm.cmd run smoke:phase8:seo")) | Out-Null
} else {
  $results.Add([PSCustomObject]@{
      Name = "phase8 remote seo smoke"
      Command = "npm.cmd run smoke:phase8:seo"
      ExitCode = 0
      Status = "SKIPPED"
      Output = @("Skipped by default to protect Vercel deploy budget.")
    }) | Out-Null
}

$latestLocalSeoSmoke = Find-LatestReport -Pattern "99_phase8_local_seo_smoke_*.md"
$latestRemoteSeoSmoke = Find-LatestReport -Pattern "98_phase8_marketing_seo_smoke_*.md"

$failed = $results | Where-Object { $_.Status -eq "FAIL" }
$status = if ($failed.Count -eq 0) { "PASS" } else { "FAIL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 8 Readiness Report") | Out-Null
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
$lines.Add("- local seo smoke: " + $(if ($latestLocalSeoSmoke) { "website/plan/" + $latestLocalSeoSmoke.Name } else { "BULUNAMADI" })) | Out-Null
$lines.Add("- remote seo smoke: " + $(if ($latestRemoteSeoSmoke) { "website/plan/" + $latestRemoteSeoSmoke.Name } else { "BULUNAMADI" })) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Notes") | Out-Null
$lines.Add("- Faz 8 kod kalite kapisi lokalde lint/build + local SEO smoke ile kapanir.") | Out-Null
$lines.Add("- Canli endpoint dogrulamasi deploy penceresinde tek kosu ile (`smoke:phase8:seo`) tamamlanir.") | Out-Null

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[PHASE8-READINESS] report -> " + $reportPath) -ForegroundColor Green

if ($status -eq "PASS") {
  exit 0
}
exit 1

