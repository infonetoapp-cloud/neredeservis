param(
  [int]$Port = 3200,
  [switch]$SkipRules
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$webDir = (Resolve-Path (Join-Path $repoRoot "website\apps\web")).Path
$functionsDir = (Resolve-Path (Join-Path $repoRoot "functions")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("82_phase5_local_gate_run_" + $dateSlug + ".md")

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
    })
}

function Invoke-StepCommand {
  param(
    [string]$Step,
    [string]$WorkingDirectory,
    [string[]]$CommandParts
  )
  Write-Host ("[PHASE5] " + $Step + " -> " + ($CommandParts -join " ")) -ForegroundColor Cyan
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

function Wait-ForHttpReady {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 90
  )
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 2
      continue
    }
    Start-Sleep -Seconds 2
  }
  return $false
}

function Run-RouteSmoke {
  param(
    [int]$PortValue
  )

  $routes = @("/login", "/drivers", "/routes", "/vehicles", "/live-ops", "/admin")
  $baseUrl = "http://127.0.0.1:$PortValue"
  $allPass = $true

  $devProcess = Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev", "--", "--port", "$PortValue") -WorkingDirectory $webDir -PassThru
  try {
    if (-not (Wait-ForHttpReady -Url ($baseUrl + "/login") -TimeoutSeconds 120)) {
      Add-Result -Step "web route smoke bootstrap" -Status "FAIL" -Details "Dev server did not become ready"
      return
    }

    foreach ($route in $routes) {
      $status = 0
      try {
        $response = Invoke-WebRequest -Uri ($baseUrl + $route) -UseBasicParsing -TimeoutSec 12
        $status = [int]$response.StatusCode
      } catch {
        if ($_.Exception.Response) {
          $status = [int]$_.Exception.Response.StatusCode.value__
        } else {
          $status = -1
        }
      }

      if ($status -eq 200) {
        Add-Result -Step ("route smoke " + $route) -Status "PASS" -Details "200"
      } else {
        Add-Result -Step ("route smoke " + $route) -Status "FAIL" -Details ("HTTP " + $status)
        $allPass = $false
      }
    }

    if ($allPass) {
      Add-Result -Step "web route smoke summary" -Status "PASS" -Details "all critical routes are 200"
    } else {
      Add-Result -Step "web route smoke summary" -Status "FAIL" -Details "one or more routes failed"
    }
  } finally {
    if ($devProcess -and -not $devProcess.HasExited) {
      cmd /c ("taskkill /PID " + $devProcess.Id + " /T /F") | Out-Null
    }
  }
}

try {
  Invoke-StepCommand -Step "web lint" -WorkingDirectory $webDir -CommandParts @("npm.cmd", "run", "lint")
  Invoke-StepCommand -Step "web build" -WorkingDirectory $webDir -CommandParts @("npm.cmd", "run", "build")
  Invoke-StepCommand -Step "functions lint" -WorkingDirectory $functionsDir -CommandParts @("npm.cmd", "run", "lint")
  Invoke-StepCommand -Step "functions build" -WorkingDirectory $functionsDir -CommandParts @("npm.cmd", "run", "build")

  if ($SkipRules) {
    Add-Result -Step "rules tests" -Status "SKIP" -Details "SkipRules flag enabled"
  } else {
    Invoke-StepCommand `
      -Step "rules tests (emulators:exec)" `
      -WorkingDirectory $functionsDir `
      -CommandParts @("npx.cmd", "firebase", "emulators:exec", "--only", "firestore,database", "npm run test:rules:unit")
  }

  Run-RouteSmoke -PortValue $Port
} catch {
  Add-Result -Step "gate script" -Status "FAIL" -Details $_.Exception.Message
}

$allPassed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count -eq 0
$summaryStatus = if ($allPassed) { "PASS" } else { "FAIL" }

$lines = New-Object System.Collections.Generic.List[string]
$null = $lines.Add("# Faz 5 Local Gate Run Report")
$null = $lines.Add("")
$null = $lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss"))
$null = $lines.Add("Durum: " + $summaryStatus)
$null = $lines.Add("Port: " + $Port)
$null = $lines.Add("")
$null = $lines.Add("| Step | Status | Details |")
$null = $lines.Add("| --- | --- | --- |")
foreach ($result in $results) {
  $null = $lines.Add("| " + $result.Step + " | " + $result.Status + " | " + $result.Details + " |")
}
$null = $lines.Add("")
$null = $lines.Add("Not:")
$null = $lines.Add("- Bu rapor script tarafindan otomatik uretilmistir.")
$null = $lines.Add("- Manual STG/PROD kontrolleri yine release runbook checklistine gore ayrica yapilmalidir.")

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[PHASE5] report -> " + $reportPath) -ForegroundColor Green

if (-not $allPassed) {
  exit 1
}
