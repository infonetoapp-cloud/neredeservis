param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('router-guards', 'domain-core', 'ui-widget', 'integration-smoke')]
  [string]$Lane,

  [switch]$SkipPubGet,

  [string]$DeviceId
)

$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

function Get-LocalFlutterPath {
  param([string]$RepoRoot)

  $path = Join-Path $RepoRoot '.fvm\flutter_sdk\bin\flutter.bat'
  if (-not (Test-Path $path)) {
    throw "Local .fvm Flutter not found: $path"
  }
  return $path
}

function Invoke-LoggedCommand {
  param(
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string[]]$Arguments
  )

  $joined = ($Arguments | ForEach-Object {
      if ($_ -match '\s') { "`"$_`"" } else { $_ }
    }) -join ' '
  Write-Host ">> $Executable $joined"
  & $Executable @Arguments
}

function Get-LaneTargets {
  param([string]$LaneName)

  switch ($LaneName) {
    'router-guards' {
      return @('test', 'test/app/router', '-r', 'compact')
    }
    'domain-core' {
      return @(
        'test',
        'test/auth',
        'test/config',
        'test/core',
        'test/domain',
        'test/features/domain',
        '-r',
        'compact'
      )
    }
    'ui-widget' {
      return @(
        'test',
        'test/ui',
        'test/widget_test.dart',
        '-r',
        'compact'
      )
    }
    'integration-smoke' {
      if ([string]::IsNullOrWhiteSpace($DeviceId)) {
        throw "Lane 'integration-smoke' requires -DeviceId (e.g. emulator-5554)."
      }
      return @(
        'test',
        'integration_test/smoke_startup_test.dart',
        '-d',
        $DeviceId,
        '-r',
        'compact'
      )
    }
    default {
      throw "Unsupported lane: $LaneName"
    }
  }
}

$repoRoot = Get-RepoRoot
$flutter = Get-LocalFlutterPath -RepoRoot $repoRoot

Push-Location $repoRoot
try {
  Write-Host "== NeredeServis Test Lane =="
  Write-Host "Lane: $Lane"
  Write-Host "Flutter: $flutter"

  if (-not $SkipPubGet) {
    Invoke-LoggedCommand -Executable $flutter -Arguments @('pub', 'get')
  } else {
    Write-Host "Skipping pub get (requested)."
  }

  $laneArgs = Get-LaneTargets -LaneName $Lane
  Invoke-LoggedCommand -Executable $flutter -Arguments $laneArgs
} finally {
  Pop-Location
}

