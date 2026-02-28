param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$deferredPackagesJsonPath = Join-Path $appImpactDir "22_phase11_deferred_sprint_packages_latest.json"
$latestPromptPath = Join-Path $planDir "143_phase11_deferred_app_kickoff_prompt_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotPromptPath = Join-Path $planDir ("143_phase11_deferred_app_kickoff_prompt_" + $dateSlug + ".md")

function Try-WriteFileWithRetry {
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
      return $true
    } catch {
      if ($i -eq $Attempts) {
        return $false
      }
      Start-Sleep -Milliseconds $DelayMs
    }
  }
  return $false
}

if (-not (Test-Path $deferredPackagesJsonPath)) {
  throw "Deferred sprint packages json bulunamadi: $deferredPackagesJsonPath"
}

$payload = Get-Content -Path $deferredPackagesJsonPath -Raw | ConvertFrom-Json
$packages = @($payload.packages)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 11 Deferred App Kickoff Prompt") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: READY") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kullanima Hazir Prompt") | Out-Null
$lines.Add('```text') | Out-Null
$lines.Add("Sen app implementasyon agentisin. Bu turda sadece deferred app parity backlogunu kapatacaksin.") | Out-Null
$lines.Add("Kurallar:") | Out-Null
$lines.Add("1) Contract-first: yeni backend kontrati acma, mevcut web kararlarini appte parity olarak uygula.") | Out-Null
$lines.Add("2) Her tamamlanan kalem sonunda register statusunu web_done_app_done'a cek ve test kaniti birak.") | Out-Null
$lines.Add("3) Her PR tek amacli olsun; buyuk PR'lari bol.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Sprint paketleri:") | Out-Null
foreach ($pkg in $packages) {
  $lines.Add("- " + $pkg.id + " (" + $pkg.priority + "): " + $pkg.title + " [" + $pkg.total + " kalem]") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("Bu turda sira: APP-DEFERRED-S1 -> APP-DEFERRED-S2 -> APP-DEFERRED-S3") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Teslim formati:") | Out-Null
$lines.Add("- Degisen dosyalar") | Out-Null
$lines.Add("- Kapanan W2A ID listesi") | Out-Null
$lines.Add("- Test komutlari + sonuc") | Out-Null
$lines.Add("- Risk/kalan is listesi") | Out-Null
$lines.Add('```') | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Paket Referansi") | Out-Null
$lines.Add('- JSON: `app-impact/22_phase11_deferred_sprint_packages_latest.json`') | Out-Null
$lines.Add('- Markdown: `plan/141_phase11_deferred_sprint_packages_latest.md`') | Out-Null

$latestOk = Try-WriteFileWithRetry -Path $latestPromptPath -Value $lines
if (-not $latestOk) {
  Write-Warning ("[PHASE11-DEFERRED-KICKOFF] latest file lock edildi: " + $latestPromptPath)
}

$snapshotOk = Try-WriteFileWithRetry -Path $snapshotPromptPath -Value $lines
if (-not $snapshotOk) {
  throw ("[PHASE11-DEFERRED-KICKOFF] snapshot yazilamadi: " + $snapshotPromptPath)
}

Write-Host ("[PHASE11-DEFERRED-KICKOFF] latest -> " + $latestPromptPath) -ForegroundColor Green
Write-Host ("[PHASE11-DEFERRED-KICKOFF] snapshot -> " + $snapshotPromptPath) -ForegroundColor Green

exit 0
