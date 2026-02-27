param(
  [string]$Scope = "infonetoapp-clouds-projects",
  [string[]]$Targets = @("development", "production"),
  [switch]$IncludePreview,
  [string]$PreviewBranch = "web-dev-vercel"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env.local")) {
  throw ".env.local bulunamadi. Once local env olusturulmus olmali."
}

$allowedPrefixes = @("NEXT_PUBLIC_")
$blockedNames = @(
  "NEXT_PUBLIC_DEV_FAST_LOGIN_EMAIL",
  "NEXT_PUBLIC_DEV_FAST_LOGIN_PASSWORD"
)

$pairs = @{}
Get-Content ".env.local" | ForEach-Object {
  $line = $_.Trim()
  if (-not $line) { return }
  if ($line.StartsWith("#")) { return }
  $idx = $line.IndexOf("=")
  if ($idx -lt 1) { return }

  $name = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1)

  $isAllowed = $false
  foreach ($prefix in $allowedPrefixes) {
    if ($name.StartsWith($prefix)) {
      $isAllowed = $true
      break
    }
  }
  if (-not $isAllowed) { return }
  if ($blockedNames -contains $name) { return }
  if ($value -eq "") { return }

  $pairs[$name] = $value
}

if ($pairs.Count -eq 0) {
  throw "Aktarilacak NEXT_PUBLIC_ env bulunamadi."
}

if ($IncludePreview -and -not ($Targets -contains "preview")) {
  $Targets = @("preview") + $Targets
}

Write-Host "Vercel env aktarimi basliyor. Scope=$Scope Targets=$($Targets -join ',')" -ForegroundColor Cyan
Write-Host "Anahtar sayisi: $($pairs.Count)" -ForegroundColor Cyan

foreach ($target in $Targets) {
  foreach ($name in $pairs.Keys) {
    $value = $pairs[$name]
    Write-Host "Set $name -> $target" -ForegroundColor DarkCyan
    if ($target -eq "preview") {
      & npx vercel env add $name $target $PreviewBranch --value $value --yes --force -S $Scope
    }
    else {
      & npx vercel env add $name $target --value $value --yes --force -S $Scope
    }
    if ($LASTEXITCODE -ne 0) {
      throw "vercel env add basarisiz: $name ($target)"
    }
  }
}

Write-Host "Tamamlandi." -ForegroundColor Green
