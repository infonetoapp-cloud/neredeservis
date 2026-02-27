param(
  [switch]$FailOnPending,
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

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$latestReportPath = Join-Path $planDir "103_phase9_app_parity_handoff_latest.md"
$snapshotReportPath = Join-Path $planDir ("103_phase9_app_parity_handoff_" + $dateSlug + ".md")

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

$queueContent = Get-Content -Path $queuePath
$checklistContent = Get-Content -Path $checklistPath
$blockAContent = Get-Content -Path $blockAPath
$blockBContent = Get-Content -Path $blockBPath

$queuePending = @($queueContent | Where-Object { $_ -match "app_pending" }).Count
$checklistOpen = @($checklistContent | Where-Object { $_ -match "^- \[ \]" }).Count
$blockAPending = @($blockAContent | Where-Object { $_ -match "^\| W2A-" -and $_ -match "\|\s*pending\s*\|" }).Count
$blockBPending = @($blockBContent | Where-Object { $_ -match "^\| W2A-" -and $_ -match "\|\s*pending\s*\|" }).Count
$totalPending = $queuePending + $checklistOpen + $blockAPending + $blockBPending

$status = if ($totalPending -eq 0) { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 App Parity Handoff Report") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Kaynak | Acik/Pending |") | Out-Null
$lines.Add("| --- | --- |") | Out-Null
$lines.Add("| Queue app_pending satirlari (06_*) | " + $queuePending + " |") | Out-Null
$lines.Add("| Parser checklist acik maddeler (07_*) | " + $checklistOpen + " |") | Out-Null
$lines.Add("| Blok A app pending satirlari (08_*) | " + $blockAPending + " |") | Out-Null
$lines.Add("| Blok B app pending satirlari (09_*) | " + $blockBPending + " |") | Out-Null
$lines.Add("| Toplam acik kalem | " + $totalPending + " |") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Handoff Notlari") | Out-Null
$lines.Add("- Bu rapor app parser/mapping kapanisina giden backlog miktarini otomatik verir.") | Out-Null
$lines.Add("- PARTIAL durumunda app tarafi closure adimlari tamamlanmadan final cutover verilmez.") | Out-Null
$lines.Add("- Referans kaynaklar:") | Out-Null
$lines.Add("  - website/app-impact/06_core_app_parity_execution_queue_2026_02_27.md") | Out-Null
$lines.Add("  - website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md") | Out-Null
$lines.Add("  - website/app-impact/08_block_a_contract_alignment_matrix_2026_02_27.md") | Out-Null
$lines.Add("  - website/app-impact/09_block_b_membership_permission_alignment_matrix_2026_02_27.md") | Out-Null

Write-FileWithRetry -Path $latestReportPath -Value $lines
Write-Host ("[PHASE9-HANDOFF] latest -> " + $latestReportPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotReportPath -Value $lines
  Write-Host ("[PHASE9-HANDOFF] snapshot -> " + $snapshotReportPath) -ForegroundColor Green
}

if ($FailOnPending -and $status -ne "PASS") {
  exit 3
}
exit 0
