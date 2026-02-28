param(
  [string]$DeviceId = '99TSTCV4YTOJYXC6',
  [string]$PackageName = 'com.neredeservis.app.dev',
  [string]$ComponentName = 'com.neredeservis.app.dev/com.neredeservis.app.MainActivity',
  [string]$SessionId = '',
  [int]$SettleMs = 1800
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

  throw 'adb bulunamadi.'
}

function Invoke-Adb {
  param([string[]]$CommandArgs, [switch]$AllowFail)

  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $output = & $script:adb @('-s', $script:DeviceId) @CommandArgs 2>&1
  $ErrorActionPreference = $prevEap
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

function Get-UiDumpRaw {
  $remotePath = '/sdcard/__ns_ui_dump.xml'
  Invoke-Adb -CommandArgs @('shell', 'uiautomator', 'dump', $remotePath) -AllowFail | Out-Null
  $pulled = Invoke-Adb -CommandArgs @('shell', 'cat', $remotePath) -AllowFail
  return ($pulled.Output -join "`n")
}

function Capture-Screenshot {
  param([string]$Name)

  $remote = '/sdcard/__ns_screen.png'
  $local = Join-Path $script:outDir "$Name.png"
  Invoke-Adb -CommandArgs @('shell', 'screencap', '-p', $remote) | Out-Null
  Invoke-Adb -CommandArgs @('pull', $remote, $local) | Out-Null
  return $local
}

function Find-NodeCenterByContains {
  param(
    [string]$UiRaw,
    [string[]]$Needles
  )

  $regex =
    '<node [^>]*text="(?<text>[^"]*)"[^>]*content-desc="(?<desc>[^"]*)"[^>]*bounds="\[(?<x1>\d+),(?<y1>\d+)\]\[(?<x2>\d+),(?<y2>\d+)\]"'
  $matches = [regex]::Matches($UiRaw, $regex)
  if ($matches.Count -eq 0) {
    return $null
  }

  foreach ($needle in $Needles) {
    foreach ($m in $matches) {
      $text = $m.Groups['text'].Value
      $desc = $m.Groups['desc'].Value
      if ($text.IndexOf($needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0 -or
          $desc.IndexOf($needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
        $x1 = [int]$m.Groups['x1'].Value
        $y1 = [int]$m.Groups['y1'].Value
        $x2 = [int]$m.Groups['x2'].Value
        $y2 = [int]$m.Groups['y2'].Value
        return [pscustomobject]@{
          Needle = $needle
          Text = $text
          Desc = $desc
          X = [int](($x1 + $x2) / 2)
          Y = [int](($y1 + $y2) / 2)
        }
      }
    }
  }

  return $null
}

function Tap-ByNeedle {
  param(
    [string]$StepName,
    [string[]]$Needles
  )

  $raw = Get-UiDumpRaw
  $hit = Find-NodeCenterByContains -UiRaw $raw -Needles $Needles
  if ($null -eq $hit) {
    $script:manifest += "- ${StepName}: TAP_SKIPPED (metin bulunamadi: $($Needles -join ', '))"
    return $false
  }

  Invoke-Adb -CommandArgs @('shell', 'input', 'tap', $hit.X.ToString(), $hit.Y.ToString()) | Out-Null
  Start-Sleep -Milliseconds $SettleMs
  $label = if ([string]::IsNullOrWhiteSpace($hit.Text)) { $hit.Desc } else { $hit.Text }
  if ([string]::IsNullOrWhiteSpace($label)) {
    $label = '<bos>'
  }
  $script:manifest += "- ${StepName}: TAP_OK (`"$label`" @ $($hit.X),$($hit.Y))"
  return $true
}

if ([string]::IsNullOrWhiteSpace($SessionId)) {
  $SessionId = Get-Date -Format 'yyyyMMdd-HHmmss'
}

$script:DeviceId = $DeviceId
$script:adb = Resolve-AdbPath
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$script:outDir = Join-Path $root "tmp/ui_regression_screens/$SessionId"
$script:manifest = @()
New-Item -ItemType Directory -Force -Path $script:outDir | Out-Null

Invoke-Adb -CommandArgs @('wait-for-device') | Out-Null
Invoke-Adb -CommandArgs @('shell', 'am', 'force-stop', $PackageName) -AllowFail | Out-Null
Start-Sleep -Milliseconds 700
Invoke-Adb -CommandArgs @('shell', 'am', 'start', '-W', '-n', $ComponentName) | Out-Null
Start-Sleep -Milliseconds $SettleMs

$launch = Capture-Screenshot -Name '01_launch'
$script:manifest += "- 01_launch: $launch"

$uiRaw = Get-UiDumpRaw
Set-Content -Path (Join-Path $script:outDir '01_launch_ui_dump.xml') -Value $uiRaw -Encoding UTF8

if ($uiRaw.Length -lt 400) {
  Start-Sleep -Milliseconds ([math]::Max($SettleMs, 3500))
  $launchAfterSplash = Capture-Screenshot -Name '01b_post_splash'
  $script:manifest += "- 01b_post_splash: $launchAfterSplash"
  $uiRaw = Get-UiDumpRaw
  Set-Content -Path (Join-Path $script:outDir '01b_post_splash_ui_dump.xml') -Value $uiRaw -Encoding UTF8
}

# Role select -> driver
if (Tap-ByNeedle -StepName 'tap_driver' -Needles @('Sofor Olarak Devam Et', 'Şoför Olarak Devam Et', 'Olarak Devam Et', 'Soforum', 'Şoförüm')) {
  $driver = Capture-Screenshot -Name '02_driver_path'
  $script:manifest += "- 02_driver_path: $driver"
  Invoke-Adb -CommandArgs @('shell', 'input', 'keyevent', '4') -AllowFail | Out-Null
  Start-Sleep -Milliseconds $SettleMs
}

# Role select -> passenger
if (Tap-ByNeedle -StepName 'tap_passenger' -Needles @('Yolcu Olarak Devam Et', 'Yolcuyum')) {
  $passenger = Capture-Screenshot -Name '03_passenger_path'
  $script:manifest += "- 03_passenger_path: $passenger"
  Invoke-Adb -CommandArgs @('shell', 'input', 'keyevent', '4') -AllowFail | Out-Null
  Start-Sleep -Milliseconds $SettleMs
}

# Role select -> guest
if (Tap-ByNeedle -StepName 'tap_guest' -Needles @('Misafir Olarak Devam Et', 'Misafirim')) {
  $guest = Capture-Screenshot -Name '04_guest_path'
  $script:manifest += "- 04_guest_path: $guest"
  Invoke-Adb -CommandArgs @('shell', 'input', 'keyevent', '4') -AllowFail | Out-Null
  Start-Sleep -Milliseconds $SettleMs
}

# Try auth CTA if visible
if (Tap-ByNeedle -StepName 'tap_email_signin' -Needles @('Email ile Giriş', 'Email ile Giris', 'Email ile', 'Giriş', 'Giris')) {
  $email = Capture-Screenshot -Name '05_email_signin_path'
  $script:manifest += "- 05_email_signin_path: $email"
  Invoke-Adb -CommandArgs @('shell', 'input', 'keyevent', '4') -AllowFail | Out-Null
  Start-Sleep -Milliseconds $SettleMs
}

$manifestPath = Join-Path $script:outDir 'manifest.md'
$manifestHeader = @(
  "# UI Regression Screenshot Set - $SessionId"
  ''
  "- Device: $DeviceId"
  "- Package: $PackageName"
  "- GeneratedAt: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  ''
  '## Captures'
)
($manifestHeader + $script:manifest) | Out-File -FilePath $manifestPath -Encoding utf8

Write-Host "Screenshot set hazir: $script:outDir"
Write-Host "Manifest: $manifestPath"
