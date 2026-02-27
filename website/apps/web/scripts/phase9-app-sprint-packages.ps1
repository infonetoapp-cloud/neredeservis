param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$parserChecklistPath = Join-Path $appImpactDir "07_app_parser_mapping_checklist_2026_02_27.md"
$cutoverChecklistPath = Join-Path $appImpactDir "03_app_integration_cutover_checklist.md"

$latestMarkdownPath = Join-Path $planDir "111_phase9_app_sprint_packages_latest.md"
$latestJsonPath = Join-Path $appImpactDir "12_phase9_app_sprint_packages_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotMarkdownPath = Join-Path $planDir ("111_phase9_app_sprint_packages_" + $dateSlug + ".md")
$snapshotJsonPath = Join-Path $planDir ("112_phase9_app_sprint_packages_json_" + $dateSlug + ".json")

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

$parserChecklist = Get-Content -Path $parserChecklistPath
$cutoverChecklist = Get-Content -Path $cutoverChecklistPath

function Get-ChecklistSectionItems {
  param(
    [string[]]$Content,
    [string]$StartPattern,
    [string]$EndPattern
  )
  $items = New-Object System.Collections.Generic.List[object]
  $inside = $false
  foreach ($line in $Content) {
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

function Select-ByText {
  param(
    [object[]]$Items,
    [string[]]$Needles
  )
  $selected = New-Object System.Collections.Generic.List[object]
  foreach ($item in $Items) {
    $text = [string]$item.text
    $match = $false
    foreach ($needle in $Needles) {
      if ($text -like ("*" + $needle + "*")) {
        $match = $true
        break
      }
    }
    if ($match) {
      $selected.Add($item) | Out-Null
    }
  }
  return $selected.ToArray()
}

$section1 = Get-ChecklistSectionItems -Content $parserChecklist -StartPattern '^## 1\)' -EndPattern '^## 2\)'
$section2 = Get-ChecklistSectionItems -Content $parserChecklist -StartPattern '^## 2\)' -EndPattern '^## 3\)'
$section3 = Get-ChecklistSectionItems -Content $parserChecklist -StartPattern '^## 3\)' -EndPattern '^## 4\)'
$section4 = Get-ChecklistSectionItems -Content $parserChecklist -StartPattern '^## 4\)' -EndPattern '^## 5\)'
$section5 = Get-ChecklistSectionItems -Content $parserChecklist -StartPattern '^## 5\)' -EndPattern '^## 6\)'
$section6 = Get-ChecklistSectionItems -Content $parserChecklist -StartPattern '^## 6\)' -EndPattern '^## 7\)'
$section7 = Get-ChecklistSectionItems -Content $parserChecklist -StartPattern '^## 7\)' -EndPattern '^## 8\)'

$criticalErrorCodes = @(
  "426 Upgrade Required",
  "UPDATE_TOKEN_MISMATCH",
  "ACTIVE_TRIP_ROUTE_STRUCTURE_LOCKED",
  "ROUTE_STOP_INVALID_STATE",
  "ROUTE_STOP_REORDER_STATE_INVALID"
)
$membershipErrorCodes = @(
  "OWNER_MEMBER_IMMUTABLE",
  "SELF_MEMBER_REMOVE_FORBIDDEN",
  "INVITE_EMAIL_NOT_FOUND",
  "INVITE_NOT_ACCEPTABLE",
  "INVITE_NOT_DECLINABLE",
  "ROUTE_PRIMARY_DRIVER_IMMUTABLE"
)

$criticalErrors = Select-ByText -Items $section6 -Needles $criticalErrorCodes
$membershipErrors = Select-ByText -Items $section6 -Needles $membershipErrorCodes

$cutoverItems = New-Object System.Collections.Generic.List[object]
foreach ($line in $cutoverChecklist) {
  if ($line -match '^- \[([ xX])\] (.+)$') {
    $isDone = $Matches[1] -ne " "
    $cutoverItems.Add([pscustomobject]@{
      done = $isDone
      text = $Matches[2].Trim()
    }) | Out-Null
  }
}

$packages = @(
  [pscustomobject]@{
    id = "APP-SPRINT-1"
    title = "Company Context + Vehicle + Route Base Parser"
    priority = "P0"
    w2a = @("W2A-004", "W2A-006", "W2A-007", "W2A-008", "W2A-009", "W2A-010", "W2A-011", "W2A-012")
    items = @($section1 + $section3 + (Select-ByText -Items $section2 -Needles @("createCompanyRoute", "updateCompanyRoute")))
    acceptance = @(
      "Company secimi login sonrasi deterministic fallback ile aciliyor.",
      "Vehicle/Route create-update parser katmaninda crash olmadan isleniyor.",
      "Token mismatch mesaji UI'da anlasilir gosteriliyor."
    )
  },
  [pscustomobject]@{
    id = "APP-SPRINT-2"
    title = "Route Stops + Live Ops + Critical Error Mapping"
    priority = "P0"
    w2a = @("W2A-001", "W2A-002", "W2A-003", "W2A-013", "W2A-014", "W2A-015", "W2A-016", "W2A-017")
    items = @((Select-ByText -Items $section2 -Needles @("listCompanyRouteStops", "upsertCompanyRouteStop", "deleteCompanyRouteStop", "reorderCompanyRouteStops")) + $section4 + $criticalErrors)
    acceptance = @(
      "Durak ekle/sil/sirala akislarinda soft-lock senaryolari dogru reason-code ile geri donuyor.",
      "RTDB stream kopma/yeniden baglanma sonrasi fallback semantigi korunuyor.",
      "426 ve conflict kodlari kullaniciya eyleme donuk mesajla gosteriliyor."
    )
  },
  [pscustomobject]@{
    id = "APP-SPRINT-3"
    title = "Membership/Permission Parser + Guard Error Mapping"
    priority = "P1"
    w2a = @("W2A-100", "W2A-101", "W2A-102", "W2A-103", "W2A-104", "W2A-105", "W2A-106")
    items = @($section5 + $membershipErrors)
    acceptance = @(
      "Invite accept/decline ve member update/remove akislari parser seviyesinde deterministik.",
      "Owner/self guard reason-code'lari dogru UI mesajina mapleniyor.",
      "Route permission grant/revoke/list sonuclari role-state tutarli."
    )
  },
  [pscustomobject]@{
    id = "APP-SPRINT-4"
    title = "Acceptance Smoke + Cutover Checklist Closure"
    priority = "P0"
    w2a = @("W2A-001", "W2A-002", "W2A-003", "W2A-004")
    items = @($section7 + $cutoverItems.ToArray())
    acceptance = @(
      "Parser crash-free smoke tum listedeki callable setinde PASS.",
      "Error mapping smoke listedeki tum zorunlu reason-code'larda PASS.",
      "03 app integration cutover checklist maddeleri eksiksiz kapali."
    )
  }
)

$packagePayload = New-Object System.Collections.Generic.List[object]
$totalOpen = 0
$totalItems = 0

foreach ($pkg in $packages) {
  $items = @($pkg.items)
  $total = $items.Count
  $done = @($items | Where-Object { $_.done }).Count
  $open = $total - $done
  $totalItems += $total
  $totalOpen += $open

  $packagePayload.Add([pscustomobject]@{
    id = $pkg.id
    title = $pkg.title
    priority = $pkg.priority
    w2a = $pkg.w2a
    total = $total
    done = $done
    open = $open
    items = $items
    acceptance = $pkg.acceptance
  }) | Out-Null
}

$status = if ($totalOpen -eq 0) { "PASS" } else { "PARTIAL" }

$md = New-Object System.Collections.Generic.List[string]
$md.Add("# Faz 9 App Sprint Packages") | Out-Null
$md.Add("") | Out-Null
$md.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$md.Add("Durum: " + $status) | Out-Null
$md.Add("") | Out-Null
$md.Add("## Ozet") | Out-Null
$md.Add("| Paket | Oncelik | Toplam | Tamam | Acik |") | Out-Null
$md.Add("| --- | --- | --- | --- | --- |") | Out-Null
foreach ($pkg in $packagePayload) {
  $md.Add("| " + $pkg.id + " | " + $pkg.priority + " | " + $pkg.total + " | " + $pkg.done + " | " + $pkg.open + " |") | Out-Null
}
$md.Add("| Toplam | - | " + $totalItems + " | " + ($totalItems - $totalOpen) + " | " + $totalOpen + " |") | Out-Null
$md.Add("") | Out-Null

foreach ($pkg in $packagePayload) {
  $md.Add("## " + $pkg.id + " - " + $pkg.title) | Out-Null
  $md.Add("- Oncelik: " + $pkg.priority) | Out-Null
  $md.Add("- W2A kapsami: " + ([string]::Join(", ", $pkg.w2a))) | Out-Null
  $md.Add("- Acik kalem: " + $pkg.open + "/" + $pkg.total) | Out-Null
  $md.Add("- Yapilacaklar:") | Out-Null
  foreach ($item in $pkg.items) {
    $mark = if ($item.done) { "[x]" } else { "[ ]" }
    $md.Add("  - " + $mark + " " + $item.text) | Out-Null
  }
  $md.Add("- Kabul Kriterleri:") | Out-Null
  foreach ($acc in $pkg.acceptance) {
    $md.Add("  - " + $acc) | Out-Null
  }
  $md.Add("") | Out-Null
}

$md.Add("## Sonraki 4 Adim") | Out-Null
$md.Add("1. APP-SPRINT-1'i parser stabilitesi icin once kapat.") | Out-Null
$md.Add("2. APP-SPRINT-2 ile live-ops + soft-lock reason-code semantigini netlestir.") | Out-Null
$md.Add("3. APP-SPRINT-3 ile membership/permission guard mapping'i tamamla.") | Out-Null
$md.Add("4. APP-SPRINT-4 acceptance smoke + cutover checklist closure ile final gate'e gec.") | Out-Null

$jsonPayload = [pscustomobject]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  status = $status
  stats = [pscustomobject]@{
    total = $totalItems
    open = $totalOpen
    done = ($totalItems - $totalOpen)
  }
  sources = [pscustomobject]@{
    parserChecklist = "website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md"
    cutoverChecklist = "website/app-impact/03_app_integration_cutover_checklist.md"
  }
  packages = $packagePayload
}

Write-FileWithRetry -Path $latestMarkdownPath -Value $md
Write-Host ("[PHASE9-SPRINT-PACKAGES] latest-md -> " + $latestMarkdownPath) -ForegroundColor Green

$json = $jsonPayload | ConvertTo-Json -Depth 8
Write-FileWithRetry -Path $latestJsonPath -Value $json
Write-Host ("[PHASE9-SPRINT-PACKAGES] latest-json -> " + $latestJsonPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotMarkdownPath -Value $md
  Write-FileWithRetry -Path $snapshotJsonPath -Value $json
  Write-Host ("[PHASE9-SPRINT-PACKAGES] snapshot-md -> " + $snapshotMarkdownPath) -ForegroundColor Green
  Write-Host ("[PHASE9-SPRINT-PACKAGES] snapshot-json -> " + $snapshotJsonPath) -ForegroundColor Green
}

exit 0
