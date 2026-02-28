param(
  [switch]$FailOnOpenItems,
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$checklistPath = Join-Path $appImpactDir "07_app_parser_mapping_checklist_2026_02_27.md"
$queuePath = Join-Path $appImpactDir "06_core_app_parity_execution_queue_2026_02_27.md"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$latestReportPath = Join-Path $planDir "107_phase9_app_workcards_latest.md"
$snapshotReportPath = Join-Path $planDir ("107_phase9_app_workcards_" + $dateSlug + ".md")

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
$queue = Get-Content -Path $queuePath

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
      $text = $Matches[2].Trim()
      $items.Add([pscustomobject]@{
        Done = $isDone
        Text = $text
      }) | Out-Null
    }
  }
  return $items.ToArray()
}

$companyContextItems = Get-ChecklistSectionItems -StartPattern '^## 1\)' -EndPattern '^## 2\)'
$routeStopItems = Get-ChecklistSectionItems -StartPattern '^## 2\)' -EndPattern '^## 3\)'
$vehicleItems = Get-ChecklistSectionItems -StartPattern '^## 3\)' -EndPattern '^## 4\)'
$liveOpsItems = Get-ChecklistSectionItems -StartPattern '^## 4\)' -EndPattern '^## 5\)'
$membershipItems = Get-ChecklistSectionItems -StartPattern '^## 5\)' -EndPattern '^## 6\)'
$errorMapItems = Get-ChecklistSectionItems -StartPattern '^## 6\)' -EndPattern '^## 7\)'
$acceptanceItems = Get-ChecklistSectionItems -StartPattern '^## 7\)' -EndPattern '^## 8\)'

$w2a001 = "BULUNAMADI"
foreach ($line in $queue) {
  if ($line -match 'W2A-001' -and $line -match '\*\*(.+)\*\*') {
    $w2a001 = $Matches[1].Trim()
    break
  }
}

function Build-PacketStats {
  param([object[]]$Items)
  $total = @($Items).Count
  $done = @($Items | Where-Object { $_.Done }).Count
  $open = $total - $done
  return [pscustomobject]@{
    Total = $total
    Done = $done
    Open = $open
  }
}

$statsCompany = Build-PacketStats -Items $companyContextItems
$statsRoute = Build-PacketStats -Items $routeStopItems
$statsVehicle = Build-PacketStats -Items $vehicleItems
$statsLive = Build-PacketStats -Items $liveOpsItems
$statsMembership = Build-PacketStats -Items $membershipItems
$statsError = Build-PacketStats -Items $errorMapItems
$statsAcceptance = Build-PacketStats -Items $acceptanceItems

$totalOpen = $statsCompany.Open + $statsRoute.Open + $statsVehicle.Open + $statsLive.Open + $statsMembership.Open + $statsError.Open + $statsAcceptance.Open
$status = if ($totalOpen -eq 0 -and $w2a001 -notmatch 'pending|partial|blocked') { "PASS" } else { "PARTIAL" }

function Add-OpenItems {
  param(
    [System.Collections.Generic.List[string]]$Lines,
    [object[]]$Items
  )
  $openItems = @($Items | Where-Object { -not $_.Done })
  if ($openItems.Count -eq 0) {
    $Lines.Add("- Acik madde yok.") | Out-Null
    return
  }
  foreach ($item in $openItems) {
    $Lines.Add("- " + $item.Text) | Out-Null
  }
}

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 App Workcards") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ozet") | Out-Null
$lines.Add("| Paket | Toplam | Tamam | Acik |") | Out-Null
$lines.Add("| --- | --- | --- | --- |") | Out-Null
$lines.Add("| Company Context (Secim 1) | " + $statsCompany.Total + " | " + $statsCompany.Done + " | " + $statsCompany.Open + " |") | Out-Null
$lines.Add("| Route/Stop (Secim 2) | " + $statsRoute.Total + " | " + $statsRoute.Done + " | " + $statsRoute.Open + " |") | Out-Null
$lines.Add("| Vehicle (Secim 3) | " + $statsVehicle.Total + " | " + $statsVehicle.Done + " | " + $statsVehicle.Open + " |") | Out-Null
$lines.Add("| Live Ops (Secim 4) | " + $statsLive.Total + " | " + $statsLive.Done + " | " + $statsLive.Open + " |") | Out-Null
$lines.Add("| Membership (Secim 5) | " + $statsMembership.Total + " | " + $statsMembership.Done + " | " + $statsMembership.Open + " |") | Out-Null
$lines.Add("| Error Mapping (Secim 6) | " + $statsError.Total + " | " + $statsError.Done + " | " + $statsError.Open + " |") | Out-Null
$lines.Add("| Acceptance (Secim 7) | " + $statsAcceptance.Total + " | " + $statsAcceptance.Done + " | " + $statsAcceptance.Open + " |") | Out-Null
$lines.Add("| Toplam | " + ($statsCompany.Total + $statsRoute.Total + $statsVehicle.Total + $statsLive.Total + $statsMembership.Total + $statsError.Total + $statsAcceptance.Total) + " | " + ($statsCompany.Done + $statsRoute.Done + $statsVehicle.Done + $statsLive.Done + $statsMembership.Done + $statsError.Done + $statsAcceptance.Done) + " | " + $totalOpen + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kritik Gate") | Out-Null
$lines.Add("- W2A-001 durum: " + $w2a001) | Out-Null
$lines.Add("- Bu kalem app tarafinda kapanmadan final cutover onayi verilmez.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Workcard-1: Company + Vehicle Parser") | Out-Null
$lines.Add("- Kapsam: W2A-004, W2A-006..010") | Out-Null
Add-OpenItems -Lines $lines -Items ($companyContextItems + $vehicleItems)
$lines.Add("") | Out-Null
$lines.Add("## Workcard-2: Route + Stop Parser") | Out-Null
$lines.Add("- Kapsam: W2A-011..015") | Out-Null
Add-OpenItems -Lines $lines -Items $routeStopItems
$lines.Add("") | Out-Null
$lines.Add("## Workcard-3: Live Ops + Error Mapping") | Out-Null
$lines.Add("- Kapsam: W2A-001, W2A-002, W2A-016, W2A-017") | Out-Null
Add-OpenItems -Lines $lines -Items ($liveOpsItems + $errorMapItems)
$lines.Add("") | Out-Null
$lines.Add("## Workcard-4: Membership + Acceptance Smoke") | Out-Null
$lines.Add("- Kapsam: W2A-100..106") | Out-Null
Add-OpenItems -Lines $lines -Items ($membershipItems + $acceptanceItems)

Write-FileWithRetry -Path $latestReportPath -Value $lines
Write-Host ("[PHASE9-WORKCARDS] latest -> " + $latestReportPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotReportPath -Value $lines
  Write-Host ("[PHASE9-WORKCARDS] snapshot -> " + $snapshotReportPath) -ForegroundColor Green
}

if ($FailOnOpenItems -and $totalOpen -gt 0) {
  exit 7
}
exit 0
