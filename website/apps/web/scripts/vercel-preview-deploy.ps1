param(
  [string]$Scope = "infonetoapp-clouds-projects"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path ".env.local")) {
  throw ".env.local bulunamadi."
}

$argsList = New-Object System.Collections.Generic.List[string]
$argsList.Add("vercel")
$argsList.Add("deploy")
$argsList.Add("--yes")
$argsList.Add("--scope")
$argsList.Add($Scope)
$argsList.Add("--target")
$argsList.Add("preview")

$pairs = @{}
Get-Content ".env.local" | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith("#")) { return }
  $idx = $line.IndexOf("=")
  if ($idx -lt 1) { return }
  $name = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1)
  if (-not $name.StartsWith("NEXT_PUBLIC_")) { return }
  if ($name -in @("NEXT_PUBLIC_DEV_FAST_LOGIN_EMAIL", "NEXT_PUBLIC_DEV_FAST_LOGIN_PASSWORD")) { return }
  $pairs[$name] = $value
}

foreach ($name in $pairs.Keys) {
  $kv = "{0}={1}" -f $name, $pairs[$name]
  $argsList.Add("--build-env")
  $argsList.Add($kv)
  $argsList.Add("--env")
  $argsList.Add($kv)
}

Write-Host "Vercel preview deploy basliyor..." -ForegroundColor Cyan
Write-Host "Scope: $Scope" -ForegroundColor Cyan
Write-Host "Env count: $($pairs.Count)" -ForegroundColor Cyan

$commandLine = $argsList | ForEach-Object {
  if ($_ -match "\s") { '"' + $_ + '"' } else { $_ }
}
Write-Host ("npx " + ($commandLine -join " ")) -ForegroundColor DarkGray

& npx @argsList
exit $LASTEXITCODE
