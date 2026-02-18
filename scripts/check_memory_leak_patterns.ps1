param(
  [string]$Root = "lib"
)

$ErrorActionPreference = "Stop"

$pattern = "AnimationController|TextEditingController|ScrollController|PageController|TabController|FocusNode|StreamSubscription<|\\bTimer\\b"
$files = rg -l --glob "*.dart" $pattern $Root 2>$null

if (-not $files) {
  Write-Output "[memory-scan] No leak-prone constructs found under $Root."
  exit 0
}

$issues = New-Object System.Collections.Generic.List[string]

foreach ($file in $files) {
  $content = Get-Content -Raw $file
  $hasDisposeMethod = $content -match "void\s+dispose\s*\(\)\s*{"

  $hasController = $content -match "AnimationController|TextEditingController|ScrollController|PageController|TabController|FocusNode"
  if ($hasController -and -not $hasDisposeMethod) {
    $issues.Add("$file -> controller/focus node used but dispose() override not found")
  }

  $hasSubscription = $content -match "StreamSubscription<"
  $hasCancel = $content -match "\.cancel\(\)\s*;"
  if ($hasSubscription -and -not $hasCancel) {
    $issues.Add("$file -> StreamSubscription found without cancel() call")
  }

  $hasTimerField = $content -match "(?m)^\s*(?:late\s+)?(?:final\s+)?Timer(?:\?)?\s+\w+"
  $hasTimerCtor = $content -match "=\s*Timer\("
  if (($hasTimerField -or $hasTimerCtor) -and -not $hasCancel) {
    $issues.Add("$file -> Timer usage found without cancel() call")
  }
}

if ($issues.Count -gt 0) {
  Write-Output "[memory-scan] Issues found:"
  foreach ($issue in $issues) {
    Write-Output " - $issue"
  }
  exit 1
}

Write-Output "[memory-scan] OK. No leak-prone dispose/cancel gaps found in scanned files."
exit 0
