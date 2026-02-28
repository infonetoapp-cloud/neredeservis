param(
  [switch]$RequireFullPreview,
  [switch]$FailOnWarn
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("83_vercel_env_audit_" + $dateSlug + ".md")

$requiredPublic = @(
  "NEXT_PUBLIC_APP_ENV",
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
  "NEXT_PUBLIC_MAPBOX_TOKEN"
)

$optionalPublic = @(
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN",
  "NEXT_PUBLIC_ENABLE_EMAIL_LOGIN",
  "NEXT_PUBLIC_ENABLE_MICROSOFT_LOGIN"
)

function Get-VercelEnvNames {
  param([string]$Environment)

  Write-Host ("[VERCEL-AUDIT] env ls " + $Environment) -ForegroundColor Cyan
  $combinedFile = [System.IO.Path]::GetTempFileName()
  cmd /c ("npx.cmd vercel env ls " + $Environment + " > """ + $combinedFile + """ 2>&1")
  $output = @()
  if (Test-Path $combinedFile) {
    $output += Get-Content -Path $combinedFile
    Remove-Item -Path $combinedFile -Force -ErrorAction SilentlyContinue
  }

  if ($LASTEXITCODE -ne 0) {
    throw ("vercel env ls failed for " + $Environment)
  }

  $names = New-Object System.Collections.Generic.HashSet[string]
  foreach ($line in $output) {
    $cleanLine = [System.Text.RegularExpressions.Regex]::Replace($line, "\x1B\[[0-9;]*[A-Za-z]", "")
    if ($cleanLine -match "^\s*(NEXT_PUBLIC_\S+)\s+") {
      $null = $names.Add($Matches[1])
    }
  }

  return [PSCustomObject]@{
    Environment = $Environment
    Names = @($names)
  }
}

$dev = Get-VercelEnvNames -Environment "development"
$preview = Get-VercelEnvNames -Environment "preview"
$prod = Get-VercelEnvNames -Environment "production"

function Get-Missing {
  param(
    [string[]]$Required,
    [string[]]$Actual
  )
  $actualSet = New-Object System.Collections.Generic.HashSet[string]
  foreach ($item in $Actual) {
    $null = $actualSet.Add($item)
  }
  $missing = New-Object System.Collections.Generic.List[string]
  foreach ($key in $Required) {
    if (-not $actualSet.Contains($key)) {
      $null = $missing.Add($key)
    }
  }
  return @($missing)
}

$devMissing = Get-Missing -Required $requiredPublic -Actual $dev.Names
$prodMissing = Get-Missing -Required $requiredPublic -Actual $prod.Names
$previewRequired = if ($RequireFullPreview) { $requiredPublic } else { @("NEXT_PUBLIC_MAPBOX_TOKEN") }
$previewMissing = Get-Missing -Required $previewRequired -Actual $preview.Names

$status =
  if ($devMissing.Count -eq 0 -and $prodMissing.Count -eq 0 -and $previewMissing.Count -eq 0) {
    "PASS"
  } else {
    "WARN"
  }

$lines = New-Object System.Collections.Generic.List[string]
$null = $lines.Add("# Vercel Environment Audit Report")
$null = $lines.Add("")
$null = $lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss"))
$null = $lines.Add("Durum: " + $status)
$null = $lines.Add("Preview policy: " + ($(if ($RequireFullPreview) { "full_required" } else { "minimal_required" })))
$null = $lines.Add("")
$null = $lines.Add("## Required Public Keys")
foreach ($key in $requiredPublic) {
  $null = $lines.Add("- " + $key)
}
$null = $lines.Add("")
$null = $lines.Add("## Optional Public Keys")
foreach ($key in $optionalPublic) {
  $null = $lines.Add("- " + $key)
}
$null = $lines.Add("")
$null = $lines.Add("## Environment Results")
$null = $lines.Add("")
$null = $lines.Add("| Environment | Required Missing | Present Count |")
$null = $lines.Add("| --- | --- | --- |")
$null = $lines.Add("| development | " + ($(if ($devMissing.Count -eq 0) { "none" } else { ($devMissing -join ", ") })) + " | " + $dev.Names.Count + " |")
$null = $lines.Add("| preview | " + ($(if ($previewMissing.Count -eq 0) { "none" } else { ($previewMissing -join ", ") })) + " | " + $preview.Names.Count + " |")
$null = $lines.Add("| production | " + ($(if ($prodMissing.Count -eq 0) { "none" } else { ($prodMissing -join ", ") })) + " | " + $prod.Names.Count + " |")
$null = $lines.Add("")
$null = $lines.Add("## Notes")
$null = $lines.Add("- Bu rapor sadece degisken isimlerini dogrular; deger dogrulugu manuel smoke adimlariyla devam etmelidir.")
$null = $lines.Add("- CORS, cost alerts, monitoring ve Firebase domain mapping bu rapor kapsaminda degildir.")

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[VERCEL-AUDIT] report -> " + $reportPath) -ForegroundColor Green

if ($status -eq "PASS") {
  exit 0
}
if ($FailOnWarn) {
  exit 2
}
exit 0
