param(
  [switch]$ConfirmCors,
  [switch]$ConfirmCostAlerts,
  [switch]$ConfirmMonitoring,
  [switch]$ConfirmFirebaseMapping,
  [switch]$MarkAllDone
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$webDir = (Resolve-Path (Join-Path $repoRoot "website\apps\web")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

if ($MarkAllDone) {
  $ConfirmCors = $true
  $ConfirmCostAlerts = $true
  $ConfirmMonitoring = $true
  $ConfirmFirebaseMapping = $true
}

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("97_phase6_prod_ops_closeout_" + $dateSlug + ".md")

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
  Write-Host ("[PHASE6-PROD] " + $Step + " -> " + ($CommandParts -join " ")) -ForegroundColor Cyan
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

$automationFailed = $false
try {
  Invoke-StepCommand -Step "vercel env audit" -WorkingDirectory $webDir -CommandParts @("npm.cmd", "run", "audit:vercel-env", "--", "-FailOnWarn")
  Invoke-StepCommand -Step "domain probe" -WorkingDirectory $webDir -CommandParts @("npm.cmd", "run", "probe:domains")
  Invoke-StepCommand -Step "phase6 prod manual smoke" -WorkingDirectory $webDir -CommandParts @("npm.cmd", "run", "smoke:manual:phase6", "--", "-FailOnPartial", "-SkipStg")
} catch {
  $automationFailed = $true
  Add-Result -Step "phase6 prod ops closeout orchestration" -Status "FAIL" -Details $_.Exception.Message
}

$manualChecks = @(
  [PSCustomObject]@{ Name = "CORS/origin allow-list prod hostlarla uyumlu"; Value = [bool]$ConfirmCors },
  [PSCustomObject]@{ Name = "Cost alert kanallari aktif"; Value = [bool]$ConfirmCostAlerts },
  [PSCustomObject]@{ Name = "Monitoring dashboard erisimi dogrulandi"; Value = [bool]$ConfirmMonitoring },
  [PSCustomObject]@{ Name = "Firebase prod mapping son kontrolu dogrulandi"; Value = [bool]$ConfirmFirebaseMapping }
)

foreach ($manualCheck in $manualChecks) {
  if ($manualCheck.Value) {
    Add-Result -Step $manualCheck.Name -Status "PASS" -Details "operator attestation"
  } else {
    Add-Result -Step $manualCheck.Name -Status "PENDING" -Details "operator attestation required"
  }
}

$hasFailure = ($results | Where-Object { $_.Status -eq "FAIL" }).Count -gt 0
$hasPending = ($results | Where-Object { $_.Status -eq "PENDING" }).Count -gt 0

$summaryStatus = "PASS"
if ($hasFailure) {
  $summaryStatus = "FAIL"
} elseif ($hasPending) {
  $summaryStatus = "PARTIAL"
}

$lines = New-Object System.Collections.Generic.List[string]
$null = $lines.Add("# Faz 6 Prod Ops Closeout Report")
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
$null = $lines.Add("Not:")
$null = $lines.Add("- Bu rapor Faz 6 checklistindeki prod operasyon kontrollerinin kapanis kanitidir.")
$null = $lines.Add("- Cost/monitoring/CORS/Firebase maddeleri operator attestation ile kapatilir.")

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[PHASE6-PROD] report -> " + $reportPath) -ForegroundColor Green

if ($automationFailed) {
  exit 1
}

