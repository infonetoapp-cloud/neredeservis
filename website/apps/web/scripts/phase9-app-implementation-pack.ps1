param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$sprintPackagesPath = Join-Path $appImpactDir "12_phase9_app_sprint_packages_latest.json"
$latestPath = Join-Path $planDir "123_phase9_app_implementation_pack_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotPath = Join-Path $planDir ("123_phase9_app_implementation_pack_" + $dateSlug + ".md")

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

if (-not (Test-Path $sprintPackagesPath)) {
  throw "Eksik artefact: $sprintPackagesPath"
}

$payload = Get-Content -Path $sprintPackagesPath -Raw | ConvertFrom-Json
$packages = @($payload.packages)

$all = New-Object System.Collections.Generic.List[string]
$all.Add("# Faz 9 App Implementation Pack") | Out-Null
$all.Add("") | Out-Null
$all.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$all.Add("Durum: PASS") | Out-Null
$all.Add("") | Out-Null
$all.Add("## Amac") | Out-Null
$all.Add("- App ekibinin APP-SPRINT-1..4 bloklarini tek paketle, dogrudan uygulanabilir promptlarla kapatmasi.") | Out-Null
$all.Add("") | Out-Null
$all.Add("## Giris Referanslari") | Out-Null
$all.Add("- website/app-impact/12_phase9_app_sprint_packages_latest.json") | Out-Null
$all.Add("- website/app-impact/07_app_parser_mapping_checklist_2026_02_27.md") | Out-Null
$all.Add("- website/app-impact/03_app_integration_cutover_checklist.md") | Out-Null
$all.Add("- website/app-impact/19_app_runtime_behavior_alignment_contract_2026_02_27.md") | Out-Null
$all.Add("") | Out-Null
$all.Add("## Genel Kurallar") | Out-Null
$all.Add("1. Contract-first ilerle: server shape degistirme, parser/mapping kapat.") | Out-Null
$all.Add("2. 426 ve lock reason code mesajlarini eyleme donuk map et.") | Out-Null
$all.Add("3. Live ops semantigi online/stale/offline + rtdb/trip_doc fallback ile ayni kalacak.") | Out-Null
$all.Add("4. Her sprint sonunda checklist update + smoke kaniti ver.") | Out-Null
$all.Add("") | Out-Null
$all.Add("## Sprint Promptlari") | Out-Null
$all.Add("") | Out-Null

foreach ($pkg in $packages) {
  $all.Add("### " + [string]$pkg.id + " - " + [string]$pkg.title) | Out-Null
  $all.Add("- Oncelik: " + [string]$pkg.priority) | Out-Null
  $all.Add("- Acik: " + [string]$pkg.open + "/" + [string]$pkg.total) | Out-Null
  $all.Add("- W2A: " + ([string]::Join(", ", $pkg.w2a))) | Out-Null
  $all.Add("") | Out-Null
  $all.Add("Kopyala-yapistir prompt:") | Out-Null
  $all.Add('```text') | Out-Null
  $all.Add("KOD DEGISTIR. SADECE app tarafinda bu sprinti kapat.") | Out-Null
  $all.Add("Hedef sprint: " + [string]$pkg.id + " (" + [string]$pkg.title + ")") | Out-Null
  $all.Add("Kurallar:") | Out-Null
  $all.Add("- Server kontratini degistirme.") | Out-Null
  $all.Add("- Reason-code mapping eyleme donuk ve deterministik olsun.") | Out-Null
  $all.Add("- Her degisikligin sonunda test ve kanit ekle.") | Out-Null
  $all.Add("- Dosya sisirmeden, moduler ilerle.") | Out-Null
  $all.Add("Yapilacaklar:") | Out-Null
  foreach ($item in $pkg.items | Where-Object { -not $_.done }) {
    $all.Add("- " + [string]$item.text) | Out-Null
  }
  $all.Add("Kabul kriterleri:") | Out-Null
  foreach ($acc in $pkg.acceptance) {
    $all.Add("- " + [string]$acc) | Out-Null
  }
  $all.Add("Cikti:") | Out-Null
  $all.Add("- Degisen dosyalar listesi") | Out-Null
  $all.Add("- Calisan test komutlari") | Out-Null
  $all.Add("- Hala acik kalan maddeler") | Out-Null
  $all.Add('```') | Out-Null
  $all.Add("") | Out-Null
}

$all.Add("## Gun Sonu Rapor Formati") | Out-Null
$all.Add('```text') | Out-Null
$all.Add("Sprint: APP-SPRINT-X") | Out-Null
$all.Add("Tamamlanan madde sayisi: A/B") | Out-Null
$all.Add("Degisen dosyalar: ...") | Out-Null
$all.Add("Calisan testler: ...") | Out-Null
$all.Add("Acilan riskler: ...") | Out-Null
$all.Add("Bir sonraki net 4 adim: ...") | Out-Null
$all.Add('```') | Out-Null
$all.Add("") | Out-Null
$all.Add("## Not") | Out-Null
$all.Add("- Bu paket app implementasyonunu hizlandirmak icindir; web kontrati degistirmez.") | Out-Null

Write-FileWithRetry -Path $latestPath -Value $all
Write-Host ("[PHASE9-IMPL-PACK] latest -> " + $latestPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotPath -Value $all
  Write-Host ("[PHASE9-IMPL-PACK] snapshot -> " + $snapshotPath) -ForegroundColor Green
}

exit 0
