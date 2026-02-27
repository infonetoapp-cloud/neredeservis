param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$latestPath = Join-Path $planDir "122_phase9_manual_acceptance_pack_latest.md"
$timestamp = Get-Date
$snapshotSuffix = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotPath = Join-Path $planDir ("122_phase9_manual_acceptance_pack_" + $snapshotSuffix + ".md")

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

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 Manual Acceptance Pack") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: PASS") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Hedef") | Out-Null
$lines.Add("- App tarafi parser/mapping closure oncesi en kritik 3 acceptance akisini tek pakette standartlastirmak.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Akis-1: Company Context Recoverability") | Out-Null
$lines.Add("1. Web panelde `https://app.neredeservis.app/login` uzerinden owner hesapla giris yap.") | Out-Null
$lines.Add("2. Dashboard -> mode seciminden company mode aktifken logout yap, tekrar login ol.") | Out-Null
$lines.Add("3. Beklenen: active company fallback deterministic olmali; mode secimi null-state'e dusmemeli.") | Out-Null
$lines.Add("4. Hata olursa not: parser katmani `listMyCompanies` + activeCompany resolver tarafi bloklaniyor.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Akis-2: Route/Stop Conflict Recovery") | Out-Null
$lines.Add("1. Ayni route icin iki farkli oturum ac: A ve B.") | Out-Null
$lines.Add("2. A oturumunda stop sirasini degistir; B oturumunda stale token ile update dene.") | Out-Null
$lines.Add("3. Beklenen: `UPDATE_TOKEN_MISMATCH` mesaji gorunur; reload + retry ile islem toparlar.") | Out-Null
$lines.Add("4. Hata olursa not: reason-code -> mesaj mapping eksigi veya stale token retry akisi bozuk.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Akis-3: Live Ops RTDB Fallback Semantigi") | Out-Null
$lines.Add("1. Live Ops ekraninda aktif sefer seciliyken RTDB stream baglantisini kes/simule et.") | Out-Null
$lines.Add("2. Beklenen: `live.source` `trip_doc` fallback'e gecmeli; `online/stale` semantigi korunmali.") | Out-Null
$lines.Add("3. Yeniden baglanmada durum `rtdb` kaynagina sorunsuz donmeli; stale ghost state birikmemeli.") | Out-Null
$lines.Add("4. Hata olursa not: app stream parser + stale state machine closure gerektirir.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kanit Kayit Format") | Out-Null
$lines.Add('- Her akis icin tek satir: `PASS/FAIL | tarih-saat | ortam | not`') | Out-Null
$lines.Add('- Bu cikti app tarafi smoke raporuna aktarilir: `website/app-impact/13_app_regression_smoke_checklist_phase9.md`') | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kural") | Out-Null
$lines.Add("- Bu paket web davranisini degistirmez; yalniz acceptance standardini sabitler.") | Out-Null

Write-FileWithRetry -Path $latestPath -Value $lines
Write-Host ("[PHASE9-MANUAL-ACCEPTANCE] latest -> " + $latestPath) -ForegroundColor Green
if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotPath -Value $lines
  Write-Host ("[PHASE9-MANUAL-ACCEPTANCE] snapshot -> " + $snapshotPath) -ForegroundColor Green
}

exit 0
