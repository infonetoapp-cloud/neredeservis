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
$blockAPath = Join-Path $appImpactDir "08_block_a_contract_alignment_matrix_2026_02_27.md"
$blockBPath = Join-Path $appImpactDir "09_block_b_membership_permission_alignment_matrix_2026_02_27.md"

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$latestReportPath = Join-Path $planDir "109_phase9_web_only_readiness_latest.md"
$snapshotReportPath = Join-Path $planDir ("109_phase9_web_only_readiness_" + $dateSlug + ".md")

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
$blockAContent = Get-Content -Path $blockAPath
$blockBContent = Get-Content -Path $blockBPath

function Parse-MatrixRows {
  param([string[]]$Content)
  $rows = New-Object System.Collections.Generic.List[object]
  foreach ($line in $Content) {
    if ($line -notmatch '^\| W2A-') {
      continue
    }
    $parts = $line.Split("|")
    if ($parts.Length -lt 6) {
      continue
    }
    $rows.Add([pscustomobject]@{
      W2A = $parts[1].Trim()
      Scope = $parts[2].Trim()
      WebStatus = $parts[4].Trim().ToLowerInvariant()
      AppStatus = $parts[5].Trim().ToLowerInvariant()
    }) | Out-Null
  }
  return $rows.ToArray()
}

function Is-WebOpenStatus {
  param([string]$Status)
  if ([string]::IsNullOrWhiteSpace($Status)) {
    return $true
  }
  return (
    $Status -match "partial" -or
    $Status -match "pending" -or
    $Status -match "blocked" -or
    $Status -match "bulunamadi"
  )
}

$blockARows = Parse-MatrixRows -Content $blockAContent
$blockBRows = Parse-MatrixRows -Content $blockBContent
$matrixRows = @($blockARows + $blockBRows)

$openWebRows = @($matrixRows | Where-Object { Is-WebOpenStatus -Status $_.WebStatus })
$doneWebRows = @($matrixRows | Where-Object { -not (Is-WebOpenStatus -Status $_.WebStatus) })

$queueWebPartialRows = @($queueContent | Where-Object {
  $_ -match '^-\s*`W2A-' -and $_ -match '\*\*[^*]*web_partial[^*]*\*\*'
})
$queueWebPartialCount = $queueWebPartialRows.Count

$status = if ($openWebRows.Count -eq 0 -and $queueWebPartialCount -eq 0) { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 9 Web-Only Readiness") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $status) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("## Ozet") | Out-Null
$lines.Add("| Kalem | Deger |") | Out-Null
$lines.Add("| --- | --- |") | Out-Null
$lines.Add("| Matrix toplam W2A | " + $matrixRows.Count + " |") | Out-Null
$lines.Add("| Web tarafi done W2A | " + $doneWebRows.Count + " |") | Out-Null
$lines.Add("| Web tarafi acik W2A | " + $openWebRows.Count + " |") | Out-Null
$lines.Add("| Queue web_partial satiri | " + $queueWebPartialCount + " |") | Out-Null
$lines.Add("") | Out-Null

$lines.Add("## Web Tarafinda Acik Kalanlar") | Out-Null
if ($openWebRows.Count -eq 0) {
  $lines.Add("- Acik web kalemi yok.") | Out-Null
} else {
  foreach ($row in $openWebRows) {
    $lines.Add("- " + $row.W2A + " - " + $row.Scope + " (web: " + $row.WebStatus + ")") | Out-Null
  }
}
$lines.Add("") | Out-Null

$lines.Add("## Queue Web-Partial Satirlari") | Out-Null
if ($queueWebPartialCount -eq 0) {
  $lines.Add("- Queue icinde web_partial satiri yok.") | Out-Null
} else {
  foreach ($line in $queueWebPartialRows) {
    $lines.Add("- " + $line.Trim()) | Out-Null
  }
}
$lines.Add("") | Out-Null

$lines.Add("## Kural") | Out-Null
$lines.Add("- Bu rapor sadece web closure durumunu olcer.") | Out-Null
$lines.Add("- App parser/mapping backlog'u ayrica `106_phase9_closeout_latest.md` ile takip edilir.") | Out-Null

Write-FileWithRetry -Path $latestReportPath -Value $lines
Write-Host ("[PHASE9-WEB-READINESS] latest -> " + $latestReportPath) -ForegroundColor Green

if ($Snapshot) {
  Write-FileWithRetry -Path $snapshotReportPath -Value $lines
  Write-Host ("[PHASE9-WEB-READINESS] snapshot -> " + $snapshotReportPath) -ForegroundColor Green
}

if ($FailOnPartial -and $status -ne "PASS") {
  exit 8
}
exit 0
