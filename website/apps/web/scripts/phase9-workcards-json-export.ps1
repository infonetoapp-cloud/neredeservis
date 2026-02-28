param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$checklistPath = Join-Path $appImpactDir "07_app_parser_mapping_checklist_2026_02_27.md"
$latestJsonPath = Join-Path $appImpactDir "11_phase9_app_workcards_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotJsonPath = Join-Path $planDir ("110_phase9_app_workcards_json_" + $dateSlug + ".json")

function Write-FileWithRetry {
  param(
    [string]$Path,
    [object]$Value,
    [string]$Encoding = "ascii",
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

$checklist = Get-Content -Path $checklistPath

function Get-ChecklistSectionItems {
  param(
    [string]$StartPattern,
    [string]$EndPattern
  )

  $items = New-Object System.Collections.Generic.List[object]
  $inside = $false
  foreach ($line in $checklist) {
    if ($line -match $StartPattern) {
      $inside = $true
      continue
    }
    if ($inside -and $line -match $EndPattern) {
      break
    }
    if (-not $inside) {
      continue
    }
    if ($line -match '^- \[([ xX])\] (.+)$') {
      $isDone = $Matches[1] -ne " "
      $items.Add([pscustomobject]@{
        done = $isDone
        text = $Matches[2].Trim()
      }) | Out-Null
    }
  }
  return $items.ToArray()
}

$sections = @(
  [pscustomobject]@{
    name = "company_context"
    title = "Company Context"
    w2a = @("W2A-004", "W2A-006", "W2A-007")
    items = @(Get-ChecklistSectionItems -StartPattern '^## 1\)' -EndPattern '^## 2\)')
  },
  [pscustomobject]@{
    name = "route_stop"
    title = "Route and Stop"
    w2a = @("W2A-008", "W2A-011", "W2A-012", "W2A-013", "W2A-014", "W2A-015")
    items = @(Get-ChecklistSectionItems -StartPattern '^## 2\)' -EndPattern '^## 3\)')
  },
  [pscustomobject]@{
    name = "vehicle"
    title = "Vehicle"
    w2a = @("W2A-009", "W2A-010")
    items = @(Get-ChecklistSectionItems -StartPattern '^## 3\)' -EndPattern '^## 4\)')
  },
  [pscustomobject]@{
    name = "live_ops"
    title = "Live Ops"
    w2a = @("W2A-001", "W2A-002", "W2A-016", "W2A-017")
    items = @(Get-ChecklistSectionItems -StartPattern '^## 4\)' -EndPattern '^## 5\)')
  },
  [pscustomobject]@{
    name = "membership_permissions"
    title = "Membership and Permissions"
    w2a = @("W2A-100", "W2A-101", "W2A-102", "W2A-103", "W2A-104", "W2A-105", "W2A-106")
    items = @(Get-ChecklistSectionItems -StartPattern '^## 5\)' -EndPattern '^## 6\)')
  },
  [pscustomobject]@{
    name = "error_mapping"
    title = "Error Mapping"
    w2a = @("W2A-001", "W2A-003")
    items = @(Get-ChecklistSectionItems -StartPattern '^## 6\)' -EndPattern '^## 7\)')
  },
  [pscustomobject]@{
    name = "acceptance"
    title = "Acceptance"
    w2a = @("W2A-001", "W2A-002", "W2A-003", "W2A-004")
    items = @(Get-ChecklistSectionItems -StartPattern '^## 7\)' -EndPattern '^## 8\)')
  }
)

$totalItems = 0
$doneItems = 0
$sectionPayload = New-Object System.Collections.Generic.List[object]

foreach ($section in $sections) {
  $sectionTotal = @($section.items).Count
  $sectionDone = @($section.items | Where-Object { $_.done }).Count
  $sectionOpen = $sectionTotal - $sectionDone
  $totalItems += $sectionTotal
  $doneItems += $sectionDone
  $sectionPayload.Add([pscustomobject]@{
    name = $section.name
    title = $section.title
    w2a = $section.w2a
    total = $sectionTotal
    done = $sectionDone
    open = $sectionOpen
    items = $section.items
  }) | Out-Null
}

$openItems = $totalItems - $doneItems
$status = if ($openItems -eq 0) { "PASS" } else { "PARTIAL" }

$payload = [pscustomobject]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  status = $status
  stats = [pscustomobject]@{
    total = $totalItems
    done = $doneItems
    open = $openItems
  }
  source = "website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md"
  sections = $sectionPayload
}

$json = $payload | ConvertTo-Json -Depth 8
Write-FileWithRetry -Path $latestJsonPath -Value $json
Write-Host ("[PHASE9-WORKCARDS-JSON] latest -> " + $latestJsonPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotJsonPath -Value $json
  Write-Host ("[PHASE9-WORKCARDS-JSON] snapshot -> " + $snapshotJsonPath) -ForegroundColor Green
}

exit 0
