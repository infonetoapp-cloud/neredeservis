param(
  [switch]$Snapshot
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path
$appImpactDir = (Resolve-Path (Join-Path $repoRoot "website\app-impact")).Path

$registerPath = Join-Path $appImpactDir "00_web_to_app_change_register.md"
$latestMarkdownPath = Join-Path $planDir "141_phase11_deferred_sprint_packages_latest.md"
$latestJsonPath = Join-Path $appImpactDir "22_phase11_deferred_sprint_packages_latest.json"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$snapshotMarkdownPath = Join-Path $planDir ("141_phase11_deferred_sprint_packages_" + $dateSlug + ".md")
$snapshotJsonPath = Join-Path $planDir ("142_phase11_deferred_sprint_packages_json_" + $dateSlug + ".json")

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

function PriorityOrder([string]$priority) {
  switch ($priority) {
    "P0" { return 0 }
    "P1" { return 1 }
    "P2" { return 2 }
    "P3" { return 3 }
    "P4" { return 4 }
    default { return 9 }
  }
}

function BuildPackage {
  param(
    [string]$Id,
    [string]$Title,
    [string]$Priority,
    [string]$Focus,
    [object[]]$Items
  )
  $sorted = @($Items | Sort-Object @{ Expression = { PriorityOrder($_.priority) } }, @{ Expression = { $_.id } })
  return [pscustomobject]@{
    id = $Id
    title = $Title
    priority = $Priority
    focus = $Focus
    total = $sorted.Count
    items = $sorted
  }
}

if (-not (Test-Path $registerPath)) {
  throw "Register path not found: $registerPath"
}

$linesRaw = Get-Content -Path $registerPath
$entries = New-Object System.Collections.Generic.List[hashtable]

$current = $null
foreach ($line in $linesRaw) {
  if ($line -match '^###\s+(W2A-\d+)') {
    if ($null -ne $current) {
      $entries.Add($current) | Out-Null
    }
    $current = @{
      id = $matches[1]
      status = ""
      priority = ""
      category = ""
      blocker = ""
      trigger = ""
    }
    continue
  }
  if ($null -eq $current) {
    continue
  }
  if ($line -match '^- (?:`Status`|Status)\s*:\s*`?([^`]+)`?\s*$') {
    $current.status = $matches[1].Trim()
    continue
  }
  if ($line -match '^- (?:`Priority`|Priority)\s*:\s*`?([^`]+)`?\s*$') {
    $current.priority = $matches[1].Trim()
    continue
  }
  if ($line -match '^- (?:`Kategori`|Kategori)\s*:\s*`?([^`]+)`?\s*$') {
    $current.category = $matches[1].Trim()
    continue
  }
  if ($line -match '^- (?:`Bloklayici mi\?`|Bloklayici mi\?)\s*:\s*`?([^`]+)`?\s*$') {
    $current.blocker = $matches[1].Trim()
    continue
  }
  if ($line -match '^- (?:`Web Trigger`|Web Trigger)\s*:\s*(.+)$') {
    $current.trigger = $matches[1].Trim()
    continue
  }
}
if ($null -ne $current) {
  $entries.Add($current) | Out-Null
}

$deferred = @($entries | Where-Object { $_.status -eq "web_done_app_deferred" })

$p1 = @($deferred | Where-Object { $_.priority -eq "P1" })
$p2 = @($deferred | Where-Object { $_.priority -eq "P2" })
$p3 = @($deferred | Where-Object { $_.priority -in @("P3", "P4") -or [string]::IsNullOrWhiteSpace($_.priority) })

$packages = @(
  (BuildPackage -Id "APP-DEFERRED-S1" -Title "Canonical Host + Critical App Parity" -Priority "P1" -Focus "Link host parity, deep-link allowlist, kritik uyum." -Items $p1),
  (BuildPackage -Id "APP-DEFERRED-S2" -Title "RBAC/Auth + Mid-Risk Behavior Parity" -Priority "P2" -Focus "Auth provider parity, yetki davranislari, mode/dashboard parity." -Items $p2),
  (BuildPackage -Id "APP-DEFERRED-S3" -Title "List/Pager/UX Behavior Parity" -Priority "P3" -Focus "Pagination, list summary chipleri, low-risk UX davranis uyumu." -Items $p3)
)

$total = ($deferred | Measure-Object).Count
$open = $total
$status = if ($total -gt 0) { "READY" } else { "EMPTY" }

$md = New-Object System.Collections.Generic.List[string]
$md.Add("# Faz 11 Deferred Sprint Packages") | Out-Null
$md.Add("") | Out-Null
$md.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$md.Add("Durum: " + $status) | Out-Null
$md.Add("") | Out-Null
$md.Add("## Ozet") | Out-Null
$md.Add("| Paket | Oncelik | Toplam |") | Out-Null
$md.Add("| --- | --- | --- |") | Out-Null
foreach ($pkg in $packages) {
  $md.Add("| " + $pkg.id + " | " + $pkg.priority + " | " + $pkg.total + " |") | Out-Null
}
$md.Add("| Toplam | - | " + $total + " |") | Out-Null
$md.Add("") | Out-Null

foreach ($pkg in $packages) {
  $md.Add("## " + $pkg.id + " - " + $pkg.title) | Out-Null
  $md.Add("- Oncelik: " + $pkg.priority) | Out-Null
  $md.Add("- Odak: " + $pkg.focus) | Out-Null
  $md.Add("- Kalem sayisi: " + $pkg.total) | Out-Null
  $md.Add("- W2A Kalemleri:") | Out-Null
  if ($pkg.total -eq 0) {
    $md.Add("  - (kalem yok)") | Out-Null
  } else {
    foreach ($item in $pkg.items) {
      $trigger = ($item.trigger -replace '\|', '/').Trim()
      if ($trigger.Length -gt 160) {
        $trigger = $trigger.Substring(0, 157) + "..."
      }
      $md.Add("  - [ ] " + $item.id + " (" + $item.priority + ", " + $item.category + "): " + $trigger) | Out-Null
    }
  }
  $md.Add("") | Out-Null
}

$md.Add("## Sonraki 4 Adim") | Out-Null
$md.Add("1. APP-DEFERRED-S1 kapsamindaki kritik parity maddelerini app tarafinda kapat ve register durumunu `web_done_app_done` yap.") | Out-Null
$md.Add("2. APP-DEFERRED-S2 icin auth/rbac ve davranis parity maddelerini iki blok halinde kapat.") | Out-Null
$md.Add("3. APP-DEFERRED-S3 kapsaminda list/pager UX parity maddelerini tek bir app UX sprintinde topla.") | Out-Null
$md.Add('4. Her blok sonu `readiness:phase11:sync` + `plan:phase11:deferred-worklist` kosup kalan kalemleri tekrar olc.') | Out-Null

$jsonPayload = [pscustomobject]@{
  generatedAt = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
  status = $status
  stats = [pscustomobject]@{
    total = $total
    open = $open
    done = 0
  }
  source = "website/app-impact/00_web_to_app_change_register.md"
  packages = $packages
}

$latestMdOk = Try-WriteFileWithRetry -Path $latestMarkdownPath -Value $md
if (-not $latestMdOk) {
  Write-Warning ("[PHASE11-DEFERRED-SPRINTS] latest md lock edildi: " + $latestMarkdownPath)
}

$json = $jsonPayload | ConvertTo-Json -Depth 8
$latestJsonOk = Try-WriteFileWithRetry -Path $latestJsonPath -Value $json
if (-not $latestJsonOk) {
  Write-Warning ("[PHASE11-DEFERRED-SPRINTS] latest json lock edildi: " + $latestJsonPath)
}

if ($Snapshot) {
  $snapshotMdOk = Try-WriteFileWithRetry -Path $snapshotMarkdownPath -Value $md
  if (-not $snapshotMdOk) {
    throw ("[PHASE11-DEFERRED-SPRINTS] snapshot md yazilamadi: " + $snapshotMarkdownPath)
  }
  $snapshotJsonOk = Try-WriteFileWithRetry -Path $snapshotJsonPath -Value $json
  if (-not $snapshotJsonOk) {
    throw ("[PHASE11-DEFERRED-SPRINTS] snapshot json yazilamadi: " + $snapshotJsonPath)
  }
  Write-Host ("[PHASE11-DEFERRED-SPRINTS] snapshot-md -> " + $snapshotMarkdownPath) -ForegroundColor Green
  Write-Host ("[PHASE11-DEFERRED-SPRINTS] snapshot-json -> " + $snapshotJsonPath) -ForegroundColor Green
}

Write-Host ("[PHASE11-DEFERRED-SPRINTS] latest-md -> " + $latestMarkdownPath) -ForegroundColor Green
Write-Host ("[PHASE11-DEFERRED-SPRINTS] latest-json -> " + $latestJsonPath) -ForegroundColor Green

exit 0
