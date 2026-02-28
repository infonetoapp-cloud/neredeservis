param(
  [ValidateSet('prepare', 'finalize')]
  [string]$Mode = 'prepare',
  [string]$SessionId,
  [string]$DeviceId = '99TSTCV4YTOJYXC6',
  [string]$PackageName = 'com.neredeservis.app.dev'
)

$ErrorActionPreference = 'Stop'

function Resolve-AdbPath {
  $sdkAdb = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
  if (Test-Path $sdkAdb) {
    return $sdkAdb
  }

  $adbCommand = Get-Command adb -ErrorAction SilentlyContinue
  if ($null -ne $adbCommand) {
    return $adbCommand.Source
  }

  throw 'adb bulunamadi. Android SDK platform-tools kurulumu gerekli.'
}

$adb = Resolve-AdbPath
$workspaceRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$baseDir = Join-Path $workspaceRoot 'tmp\faz_g_365_370'
New-Item -ItemType Directory -Force -Path $baseDir | Out-Null

function Invoke-Adb {
  param(
    [string[]]$CommandArgs,
    [switch]$AllowFail
  )

  $output = & $adb @('-s', $DeviceId) @CommandArgs 2>&1
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0 -and -not $AllowFail) {
    $joined = $CommandArgs -join ' '
    $text = ($output | Out-String).Trim()
    throw "ADB komutu basarisiz ($joined): $text"
  }

  return [pscustomobject]@{
    ExitCode = $exitCode
    Output = @($output)
  }
}

function Save-CommandOutput {
  param(
    [string]$FileName,
    [string[]]$CommandArgs,
    [switch]$AllowFail
  )

  $result = Invoke-Adb -CommandArgs $CommandArgs -AllowFail:$AllowFail
  $path = Join-Path $script:sessionDir $FileName
  $result.Output | Out-File -FilePath $path -Encoding utf8
  return $result
}

function Read-BatteryLevelFromFile {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    return $null
  }

  $line = Get-Content $Path | Select-String -Pattern '^\s*level:\s*(\d+)' | Select-Object -First 1
  if ($null -eq $line) {
    return $null
  }
  return [int]$line.Matches[0].Groups[1].Value
}

function Write-SessionTemplate {
  param([string]$TemplatePath)

  $content = @'
# FAZ G 365-370 Android Manuel Checklist - Session __SESSION_ID__

## Session Bilgisi
- Cihaz ID: __DEVICE_ID__
- Paket: __PACKAGE_NAME__
- Baslangic Zamani: __START_TIME__

## 369D - while-in-use red hard-block
1. Uygulamada sofor olarak gir.
2. Bir rota sec.
3. Seferi Baslat aksiyonunu dene.
4. Beklenen:
   - Sefer baslamamali.
   - Mesaj: Canli takip icin konum izni gerekli. Izin vermeden sefer baslatilamaz.

## 369E - background/always red fallback
- Android cihazda iOS always akisi birebir yok.
- Bu maddede Android karsiligi: arka plan kisiti oldugunda stale/degrade risk metni gorunurlugu.
- Beklenen metinlerden biri:
  - Arka plan konum izni kapali. Uygulama arka planda kalirsa konum guncellemesi gecikebilir (stale riski).
  - veya stale banner metinleri (Konum bilgisi gecikiyor... / Sofor baglantisi kesildi...).

## 369F - pil optimizasyon reddi degrade mode
1. Sofor aktif seferdeyken pil optimizasyon diyalogu acilsin.
2. Simdi Degil sec.
3. Beklenen:
   - Degrade banner:
     Pil optimizasyonu acik kaldigi icin degrade izleme modu aktif. Arka planda konum akisi kesilebilir.
   - Ayarlar'dan Ac CTA gorunsun.

## 365 - batarya olcumu (2 saat hedef)
- Baslangic pil seviyesi script tarafinda kaydedildi.
- 2 saat aktif sefer sonrasi finalize modu calistir.
- Hedef: ek tuketim <= %8.

## 367 - low-end cihaz testi
- A24 sinifi veya mevcut fiziksel cihazda min 30 dk:
  - rota ekrani
  - sefer baslat/bitir
  - yolcu katilim/takip
  - ayarlar gecisleri
- Beklenen: kritik donma/crash olmamasi.

## 370 - kritik hedefler
- Crash-free: logcat'te FATAL/ANR olmamasi.
- Tazelik/push KPI: telemetry backend dashboard dogrulamasi gerekir.

## Manuel Sonuc Notlari
- 369D:
- 369E:
- 369F:
- 365:
- 367:
- 370:
'@
  $content = $content.Replace('__SESSION_ID__', $SessionId)
  $content = $content.Replace('__DEVICE_ID__', $DeviceId)
  $content = $content.Replace('__PACKAGE_NAME__', $PackageName)
  $content = $content.Replace('__START_TIME__', (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))
  $content | Out-File -FilePath $TemplatePath -Encoding utf8
}

function Build-FinalReport {
  param(
    [string]$ReportPath,
    [string]$StartedAtIso,
    [int]$StartBattery,
    [int]$EndBattery,
    [int]$FatalCount,
    [int]$AnrCount,
    [int]$BatteryDelta
  )

  $durationMinutes = [math]::Round(((Get-Date) - [datetime]::Parse($StartedAtIso)).TotalMinutes, 1)
  $batteryDeltaText = if ($BatteryDelta -ge 0) { "-$BatteryDelta%" } else { "N/A" }

  $report = @'
# FAZ G 365-370 Android Session Sonucu - __SESSION_ID__

## Otomatik Toplanan Bulgular
- Cihaz: __DEVICE_ID__
- Paket: __PACKAGE_NAME__
- Sure: __DURATION_MINUTES__ dk
- Baslangic pil: __BATTERY_START__
- Bitis pil: __BATTERY_END__
- Pil farki: __BATTERY_DELTA__
- FATAL EXCEPTION sayisi: __FATAL_COUNT__
- ANR imza sayisi: __ANR_COUNT__

## 365 Durumu
- Yorum: 2 saatlik kosu tamamlanmadiysa bu veri yalnizca ara olcumdur.
- Hedef: 2 saatte <= %8

## 367 Durumu
- Yorum: low-end akis senaryolari manuel teyit gerektirir.

## 369D/369E/369F Durumu
- Yorum: bu maddelerde UI mesaji ve kullanici akisinin manuel teyidi gerekir.
- Beklenen metinler icin manual_checklist.md dosyasini kullan.

## 370 Durumu
- Crash-free icin lokal logcat taramasi yapildi.
- Tazelik/push KPI kapanisi icin backend telemetry dashboard gereklidir.

## Kanit Dosyalari
- device_props.txt
- battery_start.txt
- battery_end.txt
- package_dump_start.txt
- package_dump_end.txt
- appops_start.txt
- appops_end.txt
- logcat_dump.txt
- logcat_fatal_only.txt
- logcat_anr_only.txt
- meminfo_end.txt
- gfxinfo_end.txt
- cpuinfo_end.txt
'@
  $report = $report.Replace('__SESSION_ID__', $SessionId)
  $report = $report.Replace('__DEVICE_ID__', $DeviceId)
  $report = $report.Replace('__PACKAGE_NAME__', $PackageName)
  $report = $report.Replace('__DURATION_MINUTES__', $durationMinutes.ToString())
  $report = $report.Replace('__BATTERY_START__', $StartBattery.ToString())
  $report = $report.Replace('__BATTERY_END__', $EndBattery.ToString())
  $report = $report.Replace('__BATTERY_DELTA__', $batteryDeltaText)
  $report = $report.Replace('__FATAL_COUNT__', $FatalCount.ToString())
  $report = $report.Replace('__ANR_COUNT__', $AnrCount.ToString())

  $report | Out-File -FilePath $ReportPath -Encoding utf8
}

if ($Mode -eq 'prepare') {
  $SessionId = Get-Date -Format 'yyyyMMdd-HHmmss'
} elseif ([string]::IsNullOrWhiteSpace($SessionId)) {
  throw "finalize modunda -SessionId zorunlu. Ornek: -Mode finalize -SessionId 20260220-123000"
}

$script:sessionDir = Join-Path $baseDir $SessionId
New-Item -ItemType Directory -Force -Path $script:sessionDir | Out-Null

# Device/package precheck
Invoke-Adb -CommandArgs @('wait-for-device') | Out-Null
$deviceLine = (& $adb devices -l | Select-String -Pattern $DeviceId | Select-Object -First 1)
if ($null -eq $deviceLine) {
  throw "Cihaz baglantisi bulunamadi: $DeviceId"
}

if ($Mode -eq 'prepare') {
  Save-CommandOutput -FileName 'device_props.txt' -CommandArgs @('shell', 'getprop')
  $pkgCheck = Save-CommandOutput -FileName 'package_list.txt' -CommandArgs @('shell', 'pm', 'list', 'packages')
  if (-not (($pkgCheck.Output -join "`n") -match [regex]::Escape($PackageName))) {
    throw "Paket cihazda kurulu degil: $PackageName"
  }

  Save-CommandOutput -FileName 'battery_start.txt' -CommandArgs @('shell', 'dumpsys', 'battery')
  Save-CommandOutput -FileName 'package_dump_start.txt' -CommandArgs @('shell', 'dumpsys', 'package', $PackageName)
  Save-CommandOutput -FileName 'appops_start.txt' -CommandArgs @('shell', 'cmd', 'appops', 'get', $PackageName)
  Save-CommandOutput -FileName 'logcat_clear.txt' -CommandArgs @('logcat', '-c')

  $battReset = Save-CommandOutput -FileName 'batterystats_reset.txt' -CommandArgs @('shell', 'dumpsys', 'batterystats', '--reset') -AllowFail

  # 369D/369F hazirlik: location + notification denied
  Save-CommandOutput -FileName 'appops_set_fine_ignore.txt' -CommandArgs @('shell', 'cmd', 'appops', 'set', $PackageName, 'FINE_LOCATION', 'ignore') -AllowFail
  Save-CommandOutput -FileName 'appops_set_coarse_ignore.txt' -CommandArgs @('shell', 'cmd', 'appops', 'set', $PackageName, 'COARSE_LOCATION', 'ignore') -AllowFail
  Save-CommandOutput -FileName 'appops_set_notification_ignore.txt' -CommandArgs @('shell', 'cmd', 'appops', 'set', $PackageName, 'POST_NOTIFICATION', 'ignore') -AllowFail
  Save-CommandOutput -FileName 'appops_after_prepare.txt' -CommandArgs @('shell', 'cmd', 'appops', 'get', $PackageName)

  $batteryStart = Read-BatteryLevelFromFile -Path (Join-Path $script:sessionDir 'battery_start.txt')
  $metadata = [pscustomobject]@{
    sessionId = $SessionId
    mode = 'prepare'
    deviceId = $DeviceId
    packageName = $PackageName
    startedAt = (Get-Date).ToString('o')
    batteryStart = $batteryStart
    batterystatsResetExitCode = $battReset.ExitCode
  }
  $metadata | ConvertTo-Json -Depth 4 | Out-File -FilePath (Join-Path $script:sessionDir 'session_metadata.json') -Encoding utf8

  $manualTemplate = Join-Path $script:sessionDir 'manual_checklist.md'
  Write-SessionTemplate -TemplatePath $manualTemplate

  Write-Host "Hazirlik tamamlandi. Session: $SessionId"
  Write-Host "Cikti dizini: $script:sessionDir"
  Write-Host "Manuel checklist: $manualTemplate"
  Write-Host "Final rapor icin komut:"
  Write-Host ".\\scripts\\run_faz_g_365_370_android_validation.ps1 -Mode finalize -SessionId $SessionId -DeviceId $DeviceId -PackageName $PackageName"
  exit 0
}

$metadataPath = Join-Path $script:sessionDir 'session_metadata.json'
if (-not (Test-Path $metadataPath)) {
  throw "Session metadata bulunamadi: $metadataPath"
}

$metadataObj = Get-Content $metadataPath | ConvertFrom-Json
Save-CommandOutput -FileName 'battery_end.txt' -CommandArgs @('shell', 'dumpsys', 'battery')
Save-CommandOutput -FileName 'package_dump_end.txt' -CommandArgs @('shell', 'dumpsys', 'package', $PackageName)
Save-CommandOutput -FileName 'appops_end.txt' -CommandArgs @('shell', 'cmd', 'appops', 'get', $PackageName)
Save-CommandOutput -FileName 'meminfo_end.txt' -CommandArgs @('shell', 'dumpsys', 'meminfo', $PackageName)
Save-CommandOutput -FileName 'gfxinfo_end.txt' -CommandArgs @('shell', 'dumpsys', 'gfxinfo', $PackageName)
Save-CommandOutput -FileName 'cpuinfo_end.txt' -CommandArgs @('shell', 'dumpsys', 'cpuinfo')
$logcatDump = Save-CommandOutput -FileName 'logcat_dump.txt' -CommandArgs @('logcat', '-d')
$batterystatsEnd = Save-CommandOutput -FileName 'batterystats_end.txt' -CommandArgs @('shell', 'dumpsys', 'batterystats', $PackageName) -AllowFail

$logcatText = $logcatDump.Output
$fatalLines = $logcatText | Select-String -Pattern 'FATAL EXCEPTION'
$anrLines = $logcatText | Select-String -Pattern 'ANR in'

$fatalPath = Join-Path $script:sessionDir 'logcat_fatal_only.txt'
$anrPath = Join-Path $script:sessionDir 'logcat_anr_only.txt'
if ($null -eq $fatalLines -or $fatalLines.Count -eq 0) {
  'NO_FATAL_SIGNATURE_FOUND' | Out-File -FilePath $fatalPath -Encoding utf8
} else {
  $fatalLines | Out-File -FilePath $fatalPath -Encoding utf8
}
if ($null -eq $anrLines -or $anrLines.Count -eq 0) {
  'NO_ANR_SIGNATURE_FOUND' | Out-File -FilePath $anrPath -Encoding utf8
} else {
  $anrLines | Out-File -FilePath $anrPath -Encoding utf8
}

$batteryStart = [int]$metadataObj.batteryStart
$batteryEnd = Read-BatteryLevelFromFile -Path (Join-Path $script:sessionDir 'battery_end.txt')
$batteryDelta = if ($batteryStart -ge 0 -and $batteryEnd -ge 0) {
  $batteryStart - $batteryEnd
} else {
  -1
}

$summary = [pscustomobject]@{
  sessionId = $SessionId
  mode = 'finalize'
  deviceId = $DeviceId
  packageName = $PackageName
  startedAt = $metadataObj.startedAt
  endedAt = (Get-Date).ToString('o')
  batteryStart = $batteryStart
  batteryEnd = $batteryEnd
  batteryDelta = $batteryDelta
  fatalCount = if ($null -eq $fatalLines) { 0 } else { $fatalLines.Count }
  anrCount = if ($null -eq $anrLines) { 0 } else { $anrLines.Count }
  batterystatsExitCode = $batterystatsEnd.ExitCode
}
$summary | ConvertTo-Json -Depth 4 | Out-File -FilePath (Join-Path $script:sessionDir 'session_summary.json') -Encoding utf8

$reportPath = Join-Path $script:sessionDir 'session_report.md'
Build-FinalReport `
  -ReportPath $reportPath `
  -StartedAtIso $metadataObj.startedAt `
  -StartBattery $batteryStart `
  -EndBattery $batteryEnd `
  -FatalCount $summary.fatalCount `
  -AnrCount $summary.anrCount `
  -BatteryDelta $batteryDelta

Write-Host "Finalize tamamlandi. Session: $SessionId"
Write-Host "Rapor: $reportPath"
Write-Host "Summary JSON: $(Join-Path $script:sessionDir 'session_summary.json')"
