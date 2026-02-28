param(
  [string]$WeekLabel = '',
  [int]$Mau = 0,
  [int]$DirectionsRequests = 0,
  [int]$MapMatchingRequests = 0,
  [int]$DirectionsMonthlyCap = 0,
  [int]$MapMatchingMonthlyCap = 5000,
  [string]$MetricsFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Load-MetricsFromFile {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $null
  }
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Metrics file not found: $Path"
  }

  $raw = Get-Content -LiteralPath $Path -Raw
  if ([string]::IsNullOrWhiteSpace($raw)) {
    throw "Metrics file is empty: $Path"
  }

  return $raw | ConvertFrom-Json
}

function To-Percent {
  param(
    [double]$Value,
    [double]$Cap
  )
  if ($Cap -le 0) {
    return 'N/A'
  }
  return ('{0:N2}%' -f (($Value / $Cap) * 100.0))
}

$metrics = Load-MetricsFromFile -Path $MetricsFile
if ($null -ne $metrics) {
  if ($metrics.PSObject.Properties.Name -contains 'weekLabel') {
    $WeekLabel = [string]$metrics.weekLabel
  }
  if ($metrics.PSObject.Properties.Name -contains 'mau') {
    $Mau = [int]$metrics.mau
  }
  if ($metrics.PSObject.Properties.Name -contains 'directionsRequests') {
    $DirectionsRequests = [int]$metrics.directionsRequests
  }
  if ($metrics.PSObject.Properties.Name -contains 'mapMatchingRequests') {
    $MapMatchingRequests = [int]$metrics.mapMatchingRequests
  }
  if ($metrics.PSObject.Properties.Name -contains 'directionsMonthlyCap') {
    $DirectionsMonthlyCap = [int]$metrics.directionsMonthlyCap
  }
  if ($metrics.PSObject.Properties.Name -contains 'mapMatchingMonthlyCap') {
    $MapMatchingMonthlyCap = [int]$metrics.mapMatchingMonthlyCap
  }
}

if ([string]::IsNullOrWhiteSpace($WeekLabel)) {
  $utcNow = (Get-Date).ToUniversalTime()
  $WeekLabel = $utcNow.ToString('yyyy-MM-dd')
}

$safeWeekLabel = ($WeekLabel -replace '[^0-9A-Za-z\-_]', '_')
$outDir = Join-Path -Path 'tmp/cost_reports' -ChildPath $safeWeekLabel
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$directionsPct = To-Percent -Value $DirectionsRequests -Cap $DirectionsMonthlyCap
$mapMatchingPct = To-Percent -Value $MapMatchingRequests -Cap $MapMatchingMonthlyCap

$generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')

$report = @"
# NeredeServis Haftalik Maliyet Raporu

- Hafta etiketi: $WeekLabel
- Uretim zamani (UTC): $generatedAt

## Ozet
- MAU: $Mau
- Directions request: $DirectionsRequests
- Map Matching request: $MapMatchingRequests

## Cap Kullanimi
- Directions monthly cap: $DirectionsMonthlyCap
- Directions cap kullanimi: $directionsPct
- Map Matching monthly cap: $MapMatchingMonthlyCap
- Map Matching cap kullanimi: $mapMatchingPct

## Notlar
- Bu rapor release runbook 410 adimi icin otomatik uretilir.
- Gercek veriler BigQuery/Cloud export veya manuel metrik dosyasindan beslenebilir.
"@

$json = [ordered]@{
  weekLabel = $WeekLabel
  generatedAtUtc = $generatedAt
  mau = $Mau
  directionsRequests = $DirectionsRequests
  mapMatchingRequests = $MapMatchingRequests
  directionsMonthlyCap = $DirectionsMonthlyCap
  directionsCapUsage = $directionsPct
  mapMatchingMonthlyCap = $MapMatchingMonthlyCap
  mapMatchingCapUsage = $mapMatchingPct
}

$mdPath = Join-Path -Path $outDir -ChildPath 'weekly_cost_report.md'
$jsonPath = Join-Path -Path $outDir -ChildPath 'weekly_cost_report.json'

Set-Content -Path $mdPath -Value $report -Encoding UTF8
$json | ConvertTo-Json -Depth 4 | Set-Content -Path $jsonPath -Encoding UTF8

Write-Output "Weekly cost report generated."
Write-Output "Markdown: $mdPath"
Write-Output "Json: $jsonPath"
