param(
  [switch]$FailOnMissing,
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$diffPath = Join-Path $appImpactDir "04_api_contract_diff_register.md"
$checklistPath = Join-Path $appImpactDir "07_app_parser_mapping_checklist_2026_02_27.md"
$latestJsonPath = Join-Path $appImpactDir "10_phase9_contract_packet_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotJsonPath = Join-Path $planDir ("108_phase9_contract_packet_json_" + $dateSlug + ".json")

function Write-FileWithRetry {
  param(
    [string]$Path,
    [object]$Value,
    [string]$Encoding = "utf8",
    [int]$Attempts = 8,
    [int]$DelayMs = 250
  )
  for ($i = 1; $i -le $Attempts; $i++) {
    try {
      Set-Content -Path $Path -Value $Value -Encoding $Encoding
      return
    } catch {
      if ($i -eq $Attempts) {
        throw
      }
      Start-Sleep -Milliseconds $DelayMs
    }
  }
}

$diffContent = Get-Content -Path $diffPath
$checklistContent = Get-Content -Path $checklistPath

$entries = New-Object System.Collections.Generic.List[object]
$current = $null

foreach ($line in $diffContent) {
  if ($line -match "^### API-DIFF-(\d+)") {
    if ($null -ne $current -and $current.id -ge 1 -and $current.id -le 24) {
      $entries.Add([pscustomobject]$current) | Out-Null
    }
    $current = @{
      id = [int]$Matches[1]
      code = ""
      endpoint = ""
      diffType = ""
      status = ""
      appLayer = ""
    }
    continue
  }

  if ($null -eq $current) {
    continue
  }

  if ($line -match '^- `Endpoint/Action`:\s*(.+)$') {
    $current.endpoint = $Matches[1].Trim()
    continue
  }
  if ($line -match '^- `Degisiklik Tipi`:\s*`?(.+?)`?$') {
    $current.diffType = $Matches[1].Trim('`', ' ')
    continue
  }
  if ($line -match '^- `Durum`:\s*`?(.+?)`?$') {
    $current.status = $Matches[1].Trim('`', ' ')
    continue
  }
  if ($line -match '^- `Ilgili App Layer`:\s*(.+)$') {
    $current.appLayer = $Matches[1].Trim('`', ' ')
    continue
  }
}

if ($null -ne $current -and $current.id -ge 1 -and $current.id -le 24) {
  $entries.Add([pscustomobject]$current) | Out-Null
}

$endpointEntries = @($entries | Sort-Object id | ForEach-Object {
    [pscustomobject]@{
      id = $_.id
      code = ("API-DIFF-{0:D3}" -f $_.id)
      endpoint = $_.endpoint
      diffType = $_.diffType
      status = $_.status
      appLayer = $_.appLayer
    }
  })

$errorCodes = New-Object System.Collections.Generic.List[string]
$inErrorSection = $false
foreach ($line in $checklistContent) {
  if ($line -match "^## 6\)") {
    $inErrorSection = $true
    continue
  }
  if ($line -match "^## 7\)") {
    $inErrorSection = $false
  }
  if (-not $inErrorSection) {
    continue
  }
  if ($line -match '^- \[[ xX]\] `([^`]+)`') {
    $errorCodes.Add($Matches[1]) | Out-Null
  }
}

$endpointCount = @($endpointEntries).Count
$errorCodeCount = @($errorCodes).Count
$appPendingCount = @($endpointEntries | Where-Object { $_.status -match "app-pending" }).Count
$status = if ($endpointCount -ge 24 -and $errorCodeCount -ge 11) { "PASS" } else { "PARTIAL" }

$jsonObj = [pscustomobject]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  status = $status
  sources = @{
    apiDiff = "website/app-impact/04_api_contract_diff_register.md"
    checklist = "website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md"
  }
  stats = @{
    endpointCount = $endpointCount
    appPendingEndpointCount = $appPendingCount
    errorCodeCount = $errorCodeCount
  }
  endpoints = $endpointEntries
  errorCodes = @($errorCodes)
}

$jsonText = $jsonObj | ConvertTo-Json -Depth 8
Write-FileWithRetry -Path $latestJsonPath -Value $jsonText

Write-Host ("[PHASE9-CONTRACT-JSON] latest -> " + $latestJsonPath) -ForegroundColor Green
if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotJsonPath -Value $jsonText
  Write-Host ("[PHASE9-CONTRACT-JSON] snapshot -> " + $snapshotJsonPath) -ForegroundColor Green
}

if ($FailOnMissing -and $status -ne "PASS") {
  exit 8
}
exit 0
