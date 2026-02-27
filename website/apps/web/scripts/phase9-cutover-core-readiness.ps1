param(
  [switch]$FailOnPartial,
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$queuePath = Join-Path $appImpactDir "06_core_app_parity_execution_queue_2026_02_27.md"
$checklistPath = Join-Path $appImpactDir "07_app_parser_mapping_checklist_2026_02_27.md"
$blockAPath = Join-Path $appImpactDir "08_block_a_contract_alignment_matrix_2026_02_27.md"
$blockBPath = Join-Path $appImpactDir "09_block_b_membership_permission_alignment_matrix_2026_02_27.md"
$cutoverChecklistPath = Join-Path $appImpactDir "03_app_integration_cutover_checklist.md"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$latestReportPath = Join-Path $planDir "104_phase9_cutover_core_readiness_latest.md"
$snapshotReportPath = Join-Path $planDir ("104_phase9_cutover_core_readiness_" + $dateSlug + ".md")

function Write-FileWithRetry {
  param(
    [string]$Path,
    [object]$Value,
    [string]$Encoding = "ascii",
    [int]$Attempts = 30,
    [int]$DelayMs = 600
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

$queueContent = Get-Content -Path $queuePath
$checklistContent = Get-Content -Path $checklistPath
$blockAContent = Get-Content -Path $blockAPath
$blockBContent = Get-Content -Path $blockBPath
$cutoverChecklistContent = Get-Content -Path $cutoverChecklistPath

$w2a001Status = "BULUNAMADI"
foreach ($line in $queueContent) {
  if ($line -like '*W2A-001*') {
    if ($line -match "\*\*(.+)\*\*") {
      $w2a001Status = $Matches[1].Trim()
      break
    }
  }
}

$blockAPending = @(
  $blockAContent | Where-Object {
    $_ -match "^\| W2A-" -and $_ -match "\|\s*(pending|partial|blocked)\s*\|"
  }
).Count
$blockBPending = @(
  $blockBContent | Where-Object {
    $_ -match "^\| W2A-" -and $_ -match "\|\s*(pending|partial|blocked)\s*\|"
  }
).Count

$parserOpen = 0
$inParserSection = $false
foreach ($line in $checklistContent) {
  if ($line -match "^## 1\)") {
    $inParserSection = $true
    continue
  }
  if ($line -match "^## 6\)") {
    $inParserSection = $false
  }
  if ($inParserSection -and $line -match "^- \[ \] ") {
    $parserOpen++
  }
}

$errorMapOpen = 0
$inErrorSection = $false
foreach ($line in $checklistContent) {
  if ($line -match "^## 6\)") {
    $inErrorSection = $true
    continue
  }
  if ($line -match "^## 7\)") {
    $inErrorSection = $false
  }
  if ($inErrorSection -and $line -match "^- \[ \] ") {
    $errorMapOpen++
  }
}

$acceptanceOpen = 0
$inAcceptanceSection = $false
foreach ($line in $checklistContent) {
  if ($line -match "^## 7\)") {
    $inAcceptanceSection = $true
    continue
  }
  if ($inAcceptanceSection -and $line -match "^- \[ \] ") {
    $acceptanceOpen++
  }
}

$cutoverOpen = @($cutoverChecklistContent | Where-Object { $_ -match "^- \[ \] " }).Count
$totalPending = $blockAPending + $blockBPending + $parserOpen + $errorMapOpen + $acceptanceOpen + $cutoverOpen

$status = if ($totalPending -eq 0 -and $w2a001Status -notmatch "pending|partial|blocked") { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 Cutover Core Readiness") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Core Gate Ozet") | Out-Null
$lines.Add("| Kalem | Acik |") | Out-Null
$lines.Add("| --- | --- |") | Out-Null
$lines.Add("| Blok A pending (W2A-001..017) | " + $blockAPending + " |") | Out-Null
$lines.Add("| Blok B pending (W2A-100..106) | " + $blockBPending + " |") | Out-Null
$lines.Add("| Parser acik maddeler (07 secim 1-5) | " + $parserOpen + " |") | Out-Null
$lines.Add("| Error mapping acik maddeler (07 secim 6) | " + $errorMapOpen + " |") | Out-Null
$lines.Add("| Acceptance acik maddeler (07 secim 7) | " + $acceptanceOpen + " |") | Out-Null
$lines.Add("| Cutover checklist acik maddeler (03) | " + $cutoverOpen + " |") | Out-Null
$lines.Add("| Toplam acik core gate | " + $totalPending + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kritik Not") | Out-Null
$lines.Add("- `W2A-001` durum: **" + $w2a001Status + "**") | Out-Null
$lines.Add("- `W2A-001` kapanmadan final cutover onayi verilmez.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Sonraki 4 Adim") | Out-Null
$step1 = if ($w2a001Status -match "pending|partial|blocked") {
  "1. W2A-001 closure: app tarafinda hard-block force-update ekrani + min version gate runtime implementasyonunu tamamla."
} else {
  "1. W2A-001 kapali; force-update davranisini regression testte sabit tut."
}
$lines.Add($step1) | Out-Null

$step2 = if ($parserOpen -gt 0) {
  "2. App parser/mapping closure: 07 dosyasinda secim 1-5 maddelerini tek tek kapat."
} else {
  "2. Parser/mapping secim 1-5 PASS; yeni kontrat driftleri icin `company_contract_parser` smoke testlerini koru."
}
$lines.Add($step2) | Out-Null

$step3 = if ($errorMapOpen -gt 0) {
  "3. Error-code mapping closure: 07 secim 6 kodlarini UI copy'ye bagla."
} elseif ($acceptanceOpen -gt 0 -or $cutoverOpen -gt 0) {
  if ($cutoverOpen -eq 0) {
    "3. Acceptance smoke closure: 07 secim 7 maddelerini PASS'e cek (03 checklist kapali)."
  } else {
    "3. Acceptance smoke closure: 07 secim 7 + 03 checklist maddelerini PASS'e cek."
  }
} else {
  "3. Error mapping + acceptance PASS; kalan blokaj yoksa final cutover onayina gec."
}
$lines.Add($step3) | Out-Null

$lines.Add("4. npm run handoff:app-parity tekrar kos ve toplam pending'i tekrar olc.") | Out-Null

Write-FileWithRetry -Path $latestReportPath -Value $lines
Write-Host ("[PHASE9-READINESS] latest -> " + $latestReportPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotReportPath -Value $lines
  Write-Host ("[PHASE9-READINESS] snapshot -> " + $snapshotReportPath) -ForegroundColor Green
}

if ($FailOnPartial -and $status -ne "PASS") {
  exit 5
}
exit 0
