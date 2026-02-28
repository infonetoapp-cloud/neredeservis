param(
  [string]$Domain = "stg-app.neredeservis.app",
  [string]$Scope = "infonetoapp-clouds-projects"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("89_phase5_stg_domain_dns_check_" + $dateSlug + ".md")

$raw = @()
$status = "PASS"
$note = "configured"

$raw = cmd /c "npx vercel domains inspect $Domain --scope $Scope 2>&1"
$inspectExitCode = $LASTEXITCODE
if ($inspectExitCode -ne 0) {
  $status = "FAIL"
  $note = "inspect command exit code " + $inspectExitCode
}

$joined = ($raw -join "`n")
if ($joined -match "Domain is not configured properly" -or $joined -match "This Domain is not configured properly") {
  $status = "FAIL"
  $note = "stg dns not configured"
}

$requiredRecord = "A stg-app.neredeservis.app 76.76.21.21"

$lines = New-Object System.Collections.Generic.List[string]
$null = $lines.Add("# Faz 5 STG Domain DNS Check Report")
$null = $lines.Add("")
$null = $lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss"))
$null = $lines.Add("Durum: " + $status)
$null = $lines.Add("")
$null = $lines.Add("| Check | Status | Detail |")
$null = $lines.Add("| --- | --- | --- |")
$null = $lines.Add("| vercel domains inspect " + $Domain + " | " + $status + " | " + $note + " |")
$null = $lines.Add("| required dns record | INFO | " + $requiredRecord + " (DNS only) |")
$null = $lines.Add("")
$null = $lines.Add("## Raw Output (first 60 lines)")
$limit = [Math]::Min($raw.Count, 60)
for ($i = 0; $i -lt $limit; $i++) {
  $null = $lines.Add("- " + $raw[$i])
}

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[STG-DNS-CHECK] report -> " + $reportPath) -ForegroundColor Green

if ($status -eq "FAIL") {
  exit 2
}
exit 0
