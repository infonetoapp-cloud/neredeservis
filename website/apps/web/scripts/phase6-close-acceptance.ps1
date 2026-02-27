param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$webDir = (Resolve-Path (Join-Path $repoRoot "website\apps\web")).Path
$functionsDir = (Resolve-Path (Join-Path $repoRoot "functions")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("96_phase6_acceptance_closeout_" + $dateSlug + ".md")

$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
  param(
    [string]$Step,
    [string]$Status,
    [string]$Details
  )
  $results.Add([PSCustomObject]@{
      Step = $Step
      Status = $Status
      Details = $Details
    }) | Out-Null
}

function Invoke-StepCommand {
  param(
    [string]$Step,
    [string]$WorkingDirectory,
    [string[]]$CommandParts
  )
  Write-Host ("[PHASE6-CLOSEOUT] " + $Step + " -> " + ($CommandParts -join " ")) -ForegroundColor Cyan
  Push-Location $WorkingDirectory
  try {
    $command = $CommandParts[0]
    $commandArgs = @()
    if ($CommandParts.Length -gt 1) {
      $commandArgs = $CommandParts[1..($CommandParts.Length - 1)]
    }
    & $command @commandArgs
    if ($LASTEXITCODE -ne 0) {
      Add-Result -Step $Step -Status "FAIL" -Details ("ExitCode: " + $LASTEXITCODE)
      throw ("Step failed: " + $Step + " (ExitCode " + $LASTEXITCODE + ")")
    }
    Add-Result -Step $Step -Status "PASS" -Details "ok"
  } finally {
    Pop-Location
  }
}

try {
  Invoke-StepCommand -Step "phase6 manual ops smoke" -WorkingDirectory $webDir -CommandParts @("npm.cmd", "run", "smoke:manual:phase6", "--", "-FailOnPartial")
  Invoke-StepCommand -Step "functions phase6 acceptance tests" -WorkingDirectory $functionsDir -CommandParts @("npm.cmd", "run", "test:phase6:acceptance")
} catch {
  Add-Result -Step "phase6 acceptance closeout" -Status "FAIL" -Details $_.Exception.Message
}

$allPassed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count -eq 0
$summaryStatus = if ($allPassed) { "PASS" } else { "FAIL" }

$lines = New-Object System.Collections.Generic.List[string]
$null = $lines.Add("# Faz 6 Acceptance Closeout Report")
$null = $lines.Add("")
$null = $lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss"))
$null = $lines.Add("Durum: " + $summaryStatus)
$null = $lines.Add("")
$null = $lines.Add("| Step | Status | Details |")
$null = $lines.Add("| --- | --- | --- |")
foreach ($result in $results) {
  $null = $lines.Add("| " + $result.Step + " | " + $result.Status + " | " + $result.Details + " |")
}
$null = $lines.Add("")
$null = $lines.Add("Kapsam:")
$null = $lines.Add("- Route/stop CRUD acceptance")
$null = $lines.Add("- Live ops stream/list acceptance")
$null = $lines.Add("- Audit listing acceptance")

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[PHASE6-CLOSEOUT] report -> " + $reportPath) -ForegroundColor Green

if (-not $allPassed) {
  exit 1
}
