param(
  [string]$PilotCompanyName = "TBD_COMPANY",
  [string]$OwnerEmail = "tbd-owner@example.com",
  [string]$Environment = "stg",
  [string]$SupportContact = "support@neredeservis.app",
  [switch]$CompanyCreated,
  [switch]$OwnerVerified,
  [switch]$DriverSeeded,
  [switch]$VehicleSeeded,
  [switch]$RouteSeeded,
  [switch]$LiveOpsValidated,
  [switch]$AuditValidated,
  [switch]$SupportShared,
  [switch]$MarkAllDone
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("95_phase6_pilot_onboarding_check_" + $dateSlug + ".md")

if ($MarkAllDone) {
  $CompanyCreated = $true
  $OwnerVerified = $true
  $DriverSeeded = $true
  $VehicleSeeded = $true
  $RouteSeeded = $true
  $LiveOpsValidated = $true
  $AuditValidated = $true
  $SupportShared = $true
}

$allDone = $CompanyCreated -and $OwnerVerified -and $DriverSeeded -and $VehicleSeeded -and $RouteSeeded -and $LiveOpsValidated -and $AuditValidated -and $SupportShared
$status = if ($allDone) { "PASS" } else { "IN_PROGRESS" }

function RenderCheck {
  param([bool]$Value)
  if ($Value) { return "[x]" }
  return "[ ]"
}

$lines = New-Object System.Collections.Generic.List[string]
$null = $lines.Add("# Faz 6 Pilot Onboarding Check")
$null = $lines.Add("")
$null = $lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss"))
$null = $lines.Add("Durum: " + $status)
$null = $lines.Add("Ortam: " + $Environment)
$null = $lines.Add("Pilot Company: " + $PilotCompanyName)
$null = $lines.Add("Owner Email: " + $OwnerEmail)
$null = $lines.Add("Support Contact: " + $SupportContact)
$null = $lines.Add("")
$null = $lines.Add("## Checklist")
$null = $lines.Add("")
$null = $lines.Add("- " + (RenderCheck -Value $CompanyCreated) + " Pilot company tenant olusturuldu")
$null = $lines.Add("- " + (RenderCheck -Value $OwnerVerified) + " Owner rolu dogrulandi")
$null = $lines.Add("- " + (RenderCheck -Value $DriverSeeded) + " En az 1 driver eklendi")
$null = $lines.Add("- " + (RenderCheck -Value $VehicleSeeded) + " En az 1 vehicle eklendi")
$null = $lines.Add("- " + (RenderCheck -Value $RouteSeeded) + " En az 1 route + stop tanimlandi")
$null = $lines.Add("- " + (RenderCheck -Value $LiveOpsValidated) + " Live ops ekraninda aktif sefer goruntulendi")
$null = $lines.Add("- " + (RenderCheck -Value $AuditValidated) + " Audit panelinde ilgili mutasyon kayitlari goruldu")
$null = $lines.Add("- " + (RenderCheck -Value $SupportShared) + " Support contact/incident akisi pilot owner ile paylasildi")
$null = $lines.Add("")
$null = $lines.Add("## Evidence Links")
$null = $lines.Add("")
$null = $lines.Add('- Phase6 checklist: `website/plan/91_phase6_pilot_acceptance_checklist_2026_02_27.md`')
$null = $lines.Add('- Phase6 execution log: `website/plan/92_phase6_execution_log_2026_02_27.md`')
$null = $lines.Add('- Latest readiness: `website/plan/94_phase6_readiness_2026_02_27_1625.md`')
$null = $lines.Add("")
$null = $lines.Add("## Notes")
$null = $lines.Add("")
$null = $lines.Add("- Bu rapor manuel onboarding adimlarini tek yerde toplamak icin uretilmistir.")
$null = $lines.Add("- Checklist tamamlanmadan Faz 6 kapanisi verilmez.")
$null = $lines.Add("- Durum PASS ise onboarding kapanis kaniti tamamlanmis kabul edilir.")

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[PHASE6] report -> " + $reportPath) -ForegroundColor Green
