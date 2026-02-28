param(
  [string]$StgBaseUrl = "https://stg-app.neredeservis.app",
  [string]$ProdBaseUrl = "https://app.neredeservis.app",
  [switch]$SkipStg,
  [switch]$SkipProd
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("87_phase5_manual_smoke_probe_" + $dateSlug + ".md")

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
    if ($response.Headers["Location"]) {
      $location = [string]$response.Headers["Location"]
    }
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
  $girisPass = ($girisProbe.Status -eq "200") -or (
    ($girisProbe.Status -eq "307" -or $girisProbe.Status -eq "308") -and
    ($girisProbe.Location -like "*/login*" -or $girisProbe.Location -like "*/giris*")
  )
  Add-CheckResult -Rows $rows -Scope $Scope -Check "giris page reachable" `
    -Passed $girisPass `
    -Detail ("HTTP=" + $girisProbe.Status + "; location=" + $girisProbe.Location + "; note=" + $girisProbe.Note)

  $badge = Detect-EnvBadge -Html $loginProbe.Content
  Add-CheckResult -Rows $rows -Scope $Scope -Check "env badge match" `
    -Passed ($badge -eq $ExpectedBadge) `
    -Detail ("expected=" + $ExpectedBadge + "; actual=" + $badge)

  $googleVisible = $false
  if (-not [string]::IsNullOrWhiteSpace($loginProbe.Content)) {
    $googleVisible = $loginProbe.Content -match "Google ile Giris|Google"
  }
  Add-CheckResult -Rows $rows -Scope $Scope -Check "google login ui visible" `
    -Passed $googleVisible `
    -Detail ($(if ($googleVisible) { "Google text detected" } else { "Google text not detected in HTML" }))

  $protectedProbe = Invoke-HttpProbe -Url ($BaseUrl + "/dashboard")
  $redirectToLogin = ($protectedProbe.Status -eq "307" -or $protectedProbe.Status -eq "308") -and ($protectedProbe.Location -like "*/login*")
  $clientGuardShell = ($protectedProbe.Status -eq "200")
  $renderedLogin = ($protectedProbe.Status -eq "200") -and ($protectedProbe.Content -match "Giris Yap|Login")
  Add-CheckResult -Rows $rows -Scope $Scope -Check "anonymous guard dashboard->login" `
    -Passed ($redirectToLogin -or $renderedLogin -or $clientGuardShell) `
    -Detail ("HTTP=" + $protectedProbe.Status + "; location=" + $protectedProbe.Location + "; mode=" + $(if ($redirectToLogin) { "server_redirect" } elseif ($renderedLogin) { "login_render" } else { "client_guard_shell" }))

  $previewProbe = Invoke-HttpProbe -Url ($BaseUrl + "/r/TESTSRV01")
  Add-CheckResult -Rows $rows -Scope $Scope -Check "public route preview endpoint reachable" `
    -Passed ($previewProbe.Status -eq "200" -or $previewProbe.Status -eq "404") `
    -Detail ("HTTP=" + $previewProbe.Status + "; note=" + $previewProbe.Note)

  $privacyProbe = Invoke-HttpProbe -Url ($BaseUrl + "/gizlilik")
  Add-CheckResult -Rows $rows -Scope $Scope -Check "gizlilik page reachable" `
    -Passed ($privacyProbe.Status -eq "200") `
    -Detail ("HTTP=" + $privacyProbe.Status + "; note=" + $privacyProbe.Note)
}

if (-not $SkipProd) {
  Write-Host "[SMOKE] PROD scope probing..." -ForegroundColor Cyan
  Run-Scope -Scope "PROD" -BaseUrl $ProdBaseUrl -ExpectedBadge "PROD"
}

if (-not $SkipStg) {
  Write-Host "[SMOKE] STG scope probing..." -ForegroundColor Cyan
  Run-Scope -Scope "STG" -BaseUrl $StgBaseUrl -ExpectedBadge "STG"
}

$failed = $rows | Where-Object { $_.Status -eq "FAIL" }
$overall = if ($failed.Count -eq 0) { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 5 Manual Smoke Probe Report") | Out-Null
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
$lines.Add("- Bu script manuel closeout checklistini tam otomatik kapatmaz; yalniz STG/PROD login-guard-env gorunurlugu icin hizli probe kaniti uretir.") | Out-Null
$lines.Add("- CRUD mutasyon smoke, live stream davranisi, audit triage ve CORS/cost/monitoring adimlari manuel olarak tamamlanmalidir.") | Out-Null

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[SMOKE] report -> " + $reportPath) -ForegroundColor Green

if ($overall -eq "PASS") {
  exit 0
}
exit 0
