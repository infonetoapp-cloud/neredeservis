param(
  [string]$StgBaseUrl = "https://stg-app.neredeservis.app",
  [string]$ProdBaseUrl = "https://app.neredeservis.app",
  [switch]$FailOnPartial,
  [switch]$SkipStg,
  [switch]$SkipProd
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("93_phase6_manual_ops_smoke_" + $dateSlug + ".md")

function Detect-EnvBadge {
  param([string]$Html)
  if ([string]::IsNullOrWhiteSpace($Html)) { return "UNKNOWN" }
  if ($Html -match ">DEV<" -or $Html -match '"children":"dev"' -or $Html -match '\\"children\\":\\"dev\\"') { return "DEV" }
  if ($Html -match ">STG<" -or $Html -match '"children":"stg"' -or $Html -match '\\"children\\":\\"stg\\"') { return "STG" }
  if ($Html -match ">PROD<" -or $Html -match '"children":"prod"' -or $Html -match '\\"children\\":\\"prod\\"') { return "PROD" }
  return "UNKNOWN"
}

function Invoke-HttpProbe {
  param([string]$Url, [int]$TimeoutSec = 20)

  $status = ""
  $location = "-"
  $content = ""
  $note = "-"

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -MaximumRedirection 0
    $status = [string]$response.StatusCode
    $content = $response.Content
  } catch {
    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode.value__
      $status = [string]$statusCode
      try {
        $locationHeader = $_.Exception.Response.Headers["Location"]
        if ($locationHeader) { $location = $locationHeader }
      } catch {
        $location = "-"
      }
      try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $content = $reader.ReadToEnd()
        $reader.Close()
      } catch {
        $content = ""
      }
      $note = "HTTP redirect/error response"
    } else {
      $status = "ERR"
      $note = $_.Exception.Message
    }
  }

  return [PSCustomObject]@{
    Url = $Url
    Status = $status
    Location = $location
    Content = $content
    Note = $note
  }
}

function Add-CheckResult {
  param(
    [System.Collections.Generic.List[object]]$Rows,
    [string]$Scope,
    [string]$Check,
    [bool]$Passed,
    [string]$Detail
  )

  $Rows.Add([PSCustomObject]@{
      Scope = $Scope
      Check = $Check
      Status = $(if ($Passed) { "PASS" } else { "FAIL" })
      Detail = $Detail
    }) | Out-Null
}

$rows = New-Object System.Collections.Generic.List[object]

function Run-Scope {
  param(
    [string]$Scope,
    [string]$BaseUrl,
    [string]$ExpectedBadge
  )

  $loginProbe = Invoke-HttpProbe -Url ($BaseUrl + "/login")
  Add-CheckResult -Rows $rows -Scope $Scope -Check "login page reachable" `
    -Passed ($loginProbe.Status -eq "200") `
    -Detail ("HTTP=" + $loginProbe.Status + "; note=" + $loginProbe.Note)

  $girisProbe = Invoke-HttpProbe -Url ($BaseUrl + "/giris")
  Add-CheckResult -Rows $rows -Scope $Scope -Check "giris page reachable" `
    -Passed ($girisProbe.Status -eq "200") `
    -Detail ("HTTP=" + $girisProbe.Status + "; note=" + $girisProbe.Note)

  $badge = Detect-EnvBadge -Html $loginProbe.Content
  Add-CheckResult -Rows $rows -Scope $Scope -Check "env badge match" `
    -Passed ($badge -eq $ExpectedBadge) `
    -Detail ("expected=" + $ExpectedBadge + "; actual=" + $badge)

  $routesProbe = Invoke-HttpProbe -Url ($BaseUrl + "/routes")
  Add-CheckResult -Rows $rows -Scope $Scope -Check "routes surface reachable" `
    -Passed ($routesProbe.Status -eq "200") `
    -Detail ("HTTP=" + $routesProbe.Status + "; note=" + $routesProbe.Note)

  $liveOpsProbe = Invoke-HttpProbe -Url ($BaseUrl + "/live-ops")
  Add-CheckResult -Rows $rows -Scope $Scope -Check "live ops surface reachable" `
    -Passed ($liveOpsProbe.Status -eq "200") `
    -Detail ("HTTP=" + $liveOpsProbe.Status + "; note=" + $liveOpsProbe.Note)

  $adminProbe = Invoke-HttpProbe -Url ($BaseUrl + "/admin")
  Add-CheckResult -Rows $rows -Scope $Scope -Check "admin surface reachable" `
    -Passed ($adminProbe.Status -eq "200") `
    -Detail ("HTTP=" + $adminProbe.Status + "; note=" + $adminProbe.Note)

  $previewProbe = Invoke-HttpProbe -Url ($BaseUrl + "/r/TESTSRV01?t=dummy")
  Add-CheckResult -Rows $rows -Scope $Scope -Check "token route preview endpoint reachable" `
    -Passed ($previewProbe.Status -eq "200" -or $previewProbe.Status -eq "400" -or $previewProbe.Status -eq "404") `
    -Detail ("HTTP=" + $previewProbe.Status + "; note=" + $previewProbe.Note)

  $contactProbe = Invoke-HttpProbe -Url ($BaseUrl + "/iletisim")
  Add-CheckResult -Rows $rows -Scope $Scope -Check "iletisim page reachable" `
    -Passed ($contactProbe.Status -eq "200") `
    -Detail ("HTTP=" + $contactProbe.Status + "; note=" + $contactProbe.Note)
}

if (-not $SkipProd) {
  Write-Host "[PHASE6] PROD scope probing..." -ForegroundColor Cyan
  Run-Scope -Scope "PROD" -BaseUrl $ProdBaseUrl -ExpectedBadge "PROD"
}

if (-not $SkipStg) {
  Write-Host "[PHASE6] STG scope probing..." -ForegroundColor Cyan
  Run-Scope -Scope "STG" -BaseUrl $StgBaseUrl -ExpectedBadge "STG"
}

$failed = $rows | Where-Object { $_.Status -eq "FAIL" }
$overall = if ($failed.Count -eq 0) { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 6 Manual Ops Smoke Report") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Scope | Check | Status | Detail |") | Out-Null
$lines.Add("| --- | --- | --- | --- |") | Out-Null
foreach ($row in $rows) {
  $lines.Add("| " + $row.Scope + " | " + $row.Check + " | " + $row.Status + " | " + $row.Detail + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("Not:") | Out-Null
$lines.Add("- Bu script surface-level probe kaniti uretir; route/stop CRUD, live triage ve audit mutasyon kabul adimlari yine manuel pilot tenant ile tamamlanmalidir.") | Out-Null
$lines.Add("- Detayli acceptance adimlari: website/plan/91_phase6_pilot_acceptance_checklist_2026_02_27.md") | Out-Null

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[PHASE6] report -> " + $reportPath) -ForegroundColor Green

if ($overall -eq "PASS") {
  exit 0
}
if ($FailOnPartial) {
  exit 3
}
exit 0
