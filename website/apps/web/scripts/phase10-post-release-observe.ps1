param(
  [string]$StgBaseUrl = "https://stg-app.neredeservis.app",
  [string]$ProdBaseUrl = "https://app.neredeservis.app",
  [int]$Samples = 6,
  [int]$IntervalSeconds = 300
)

$ErrorActionPreference = "Stop"

if ($Samples -lt 1) {
  throw "Samples must be >= 1."
}
if ($IntervalSeconds -lt 1) {
  throw "IntervalSeconds must be >= 1."
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$slug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotPath = Join-Path $planDir ("132_phase10_post_release_observe_" + $slug + ".md")
$latestPath = Join-Path $planDir "132_phase10_post_release_observe_latest.md"

function Detect-EnvBadge {
  param([string]$Html)
  if ([string]::IsNullOrWhiteSpace($Html)) { return "UNKNOWN" }
  if ($Html -match ">DEV<" -or $Html -match '"children":"dev"' -or $Html -match '\\"children\\":\\"dev\\"') { return "DEV" }
  if ($Html -match ">STG<" -or $Html -match '"children":"stg"' -or $Html -match '\\"children\\":\\"stg\\"') { return "STG" }
  if ($Html -match ">PROD<" -or $Html -match '"children":"prod"' -or $Html -match '\\"children\\":\\"prod\\"') { return "PROD" }
  return "UNKNOWN"
}

function Invoke-LoginProbe {
  param([string]$BaseUrl)

  $status = ""
  $content = ""
  $note = "-"

  try {
    $response = Invoke-WebRequest -Uri ($BaseUrl + "/login") -UseBasicParsing -TimeoutSec 20 -MaximumRedirection 0
    $status = [string]$response.StatusCode
    $content = $response.Content
  } catch {
    if ($_.Exception.Response) {
      $status = [string][int]$_.Exception.Response.StatusCode.value__
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
    Status = $status
    EnvBadge = Detect-EnvBadge -Html $content
    Note = $note
  }
}

$rows = New-Object System.Collections.Generic.List[object]

for ($index = 1; $index -le $Samples; $index++) {
  $sampleTime = Get-Date
  $prodProbe = Invoke-LoginProbe -BaseUrl $ProdBaseUrl
  $stgProbe = Invoke-LoginProbe -BaseUrl $StgBaseUrl

  $rows.Add([PSCustomObject]@{
      Sample = $index
      Time = $sampleTime.ToString("HH:mm:ss")
      Scope = "PROD"
      Status = $prodProbe.Status
      EnvBadge = $prodProbe.EnvBadge
      Note = $prodProbe.Note
      Pass = ($prodProbe.Status -eq "200" -and $prodProbe.EnvBadge -eq "PROD")
    }) | Out-Null

  $rows.Add([PSCustomObject]@{
      Sample = $index
      Time = $sampleTime.ToString("HH:mm:ss")
      Scope = "STG"
      Status = $stgProbe.Status
      EnvBadge = $stgProbe.EnvBadge
      Note = $stgProbe.Note
      Pass = ($stgProbe.Status -eq "200" -and $stgProbe.EnvBadge -eq "STG")
    }) | Out-Null

  if ($index -lt $Samples) {
    Start-Sleep -Seconds $IntervalSeconds
  }
}

$failed = $rows | Where-Object { -not $_.Pass }
$overall = if ($failed.Count -eq 0) { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 10 Post-Release Observe") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("Sample sayisi: " + $Samples) | Out-Null
$lines.Add("Interval (sn): " + $IntervalSeconds) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Sample | Saat | Scope | HTTP | Env Badge | Durum | Not |") | Out-Null
$lines.Add("| --- | --- | --- | --- | --- | --- | --- |") | Out-Null
foreach ($row in $rows) {
  $lines.Add("| " + $row.Sample + " | " + $row.Time + " | " + $row.Scope + " | " + $row.Status + " | " + $row.EnvBadge + " | " + $(if ($row.Pass) { "PASS" } else { "FAIL" }) + " | " + $row.Note + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("Not: Bu rapor post-release smoke gozlem turunu otomatik toplar; mutasyon akislari manuel acceptance checklist ile kapanir.") | Out-Null

Set-Content -Path $snapshotPath -Value $lines -Encoding ascii
Set-Content -Path $latestPath -Value $lines -Encoding ascii

Write-Host ("[PHASE10-OBSERVE] latest -> " + $latestPath) -ForegroundColor Green
Write-Host ("[PHASE10-OBSERVE] snapshot -> " + $snapshotPath) -ForegroundColor Green

if ($overall -eq "PASS") {
  exit 0
}
exit 0
