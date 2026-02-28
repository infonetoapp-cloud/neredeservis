param(
  [string[]]$Urls = @(
    "https://app.neredeservis.app/login",
    "https://neredeservis.app/login",
    "https://www.neredeservis.app/login",
    "https://nsv-web-dev.vercel.app/login"
  )
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("84_domain_probe_" + $dateSlug + ".md")

$rows = New-Object System.Collections.Generic.List[object]

function Detect-EnvBadge {
  param([string]$Html)
  if ([string]::IsNullOrWhiteSpace($Html)) {
    return "UNKNOWN"
  }
  if ($Html -match ">DEV<" -or $Html -match '"children":"dev"' -or $Html -match '\\"children\\":\\"dev\\"') {
    return "DEV"
  }
  if ($Html -match ">STG<" -or $Html -match '"children":"stg"' -or $Html -match '\\"children\\":\\"stg\\"') {
    return "STG"
  }
  if ($Html -match ">PROD<" -or $Html -match '"children":"prod"' -or $Html -match '\\"children\\":\\"prod\\"') {
    return "PROD"
  }
  return "UNKNOWN"
}

foreach ($url in $Urls) {
  $status = "ERROR"
  $badge = "UNKNOWN"
  $location = "-"
  $note = "-"

  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    $status = [string]$response.StatusCode
    $badge = Detect-EnvBadge -Html $response.Content
  } catch {
    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode.value__
      $status = [string]$statusCode
      try {
        $locationHeader = $_.Exception.Response.Headers["Location"]
        if ($locationHeader) {
          $location = $locationHeader
        }
      } catch {
        $location = "-"
      }
      $note = "HTTP redirect/error response"
    } else {
      $note = $_.Exception.Message
    }
  }

  $rows.Add([PSCustomObject]@{
      Url = $url
      Status = $status
      EnvBadge = $badge
      Location = $location
      Note = $note
    })
}

$lines = New-Object System.Collections.Generic.List[string]
$null = $lines.Add("# Domain Probe Report")
$null = $lines.Add("")
$null = $lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss"))
$null = $lines.Add("")
$null = $lines.Add("| URL | HTTP | Env Badge | Location | Note |")
$null = $lines.Add("| --- | --- | --- | --- | --- |")
foreach ($row in $rows) {
  $null = $lines.Add("| " + $row.Url + " | " + $row.Status + " | " + $row.EnvBadge + " | " + $row.Location + " | " + $row.Note + " |")
}
$null = $lines.Add("")
$null = $lines.Add("Not:")
$null = $lines.Add("- Bu probe sadece URL erisimi, redirect ve HTML'deki env badge ipucunu dogrular.")
$null = $lines.Add("- Auth smoke, role/mode smoke ve domain allow-list dogrulamasi manuel checklist adimlariyla devam etmelidir.")

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[DOMAIN-PROBE] report -> " + $reportPath) -ForegroundColor Green
