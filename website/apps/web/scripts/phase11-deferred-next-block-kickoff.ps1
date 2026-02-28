param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$nextBlockJsonPath = Join-Path $appImpactDir "25_phase11_deferred_next_block_latest.json"
$latestPromptPath = Join-Path $planDir "150_phase11_deferred_next_block_kickoff_latest.md"
$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotPromptPath = Join-Path $planDir ("150_phase11_deferred_next_block_kickoff_" + $dateSlug + ".md")

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

if (-not (Test-Path $nextBlockJsonPath)) {
  throw "Eksik artefact: $nextBlockJsonPath"
}

$payload = Get-Content -Path $nextBlockJsonPath -Raw | ConvertFrom-Json
$items = @($payload.nextBlock)

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 11 Deferred Next Block Kickoff Prompt") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $(if ($items.Count -gt 0) { "READY" } else { "EMPTY" })) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kullanima Hazir Prompt") | Out-Null
$lines.Add('```text') | Out-Null
$lines.Add("Sen app implementasyon agentisin. Bu turda sadece asagidaki 4 deferred parity kalemini kapatacaksin.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Kurallar:") | Out-Null
$lines.Add("1) Contract-first: mevcut backend kontratlarini bozma, yeni endpoint acma.") | Out-Null
$lines.Add("2) Her kalem kapandiginda register statusunu web_done_app_done veya web_done_app_not_required yap.") | Out-Null
$lines.Add("3) Her PR tek amacli olsun; buyuk degisiklikleri bol.") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Bu tur kapsam (sirayla):") | Out-Null
if ($items.Count -eq 0) {
  $lines.Add("- Deferred kalem kalmadi.") | Out-Null
} else {
  foreach ($item in $items) {
    $trigger = [string]$item.trigger
    if ($trigger.Length -gt 180) {
      $trigger = $trigger.Substring(0, 177) + "..."
    }
    $lines.Add("- " + [string]$item.id + " (" + [string]$item.priority + ", " + [string]$item.category + "): " + $trigger) | Out-Null
  }
}
$lines.Add("") | Out-Null
$lines.Add("Test/kanit:") | Out-Null
$lines.Add("- Ilgili app testleri + smoke komutlari PASS") | Out-Null
$lines.Add("- Register status guncellemeleri") | Out-Null
$lines.Add("- Kisa kapanis notu (degisen dosyalar + kalan risk)") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Blok sonu zorunlu:") | Out-Null
$lines.Add("- npm run readiness:phase11:sync") | Out-Null
$lines.Add("- npm run plan:phase11:deferred-worklist") | Out-Null
$lines.Add("- npm run plan:phase11:deferred-next-block") | Out-Null
$lines.Add('```') | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Kaynak") | Out-Null
$lines.Add("- JSON: app-impact/25_phase11_deferred_next_block_latest.json") | Out-Null
$lines.Add("- Markdown: plan/148_phase11_deferred_next_block_latest.md") | Out-Null

$latestOk = Try-WriteFileWithRetry -Path $latestPromptPath -Value $lines
if (-not $latestOk) {
  Write-Warning ("[PHASE11-DEFERRED-NEXT-KICKOFF] latest file lock edildi: " + $latestPromptPath)
}

$snapshotOk = Try-WriteFileWithRetry -Path $snapshotPromptPath -Value $lines
if (-not $snapshotOk) {
  throw ("[PHASE11-DEFERRED-NEXT-KICKOFF] snapshot yazilamadi: " + $snapshotPromptPath)
}

Write-Host ("[PHASE11-DEFERRED-NEXT-KICKOFF] latest -> " + $latestPromptPath) -ForegroundColor Green
Write-Host ("[PHASE11-DEFERRED-NEXT-KICKOFF] snapshot -> " + $snapshotPromptPath) -ForegroundColor Green

exit 0
