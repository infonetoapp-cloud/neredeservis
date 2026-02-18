param(
  [ValidateSet('apk-debug', 'apk-release')]
  [string]$Mode = 'apk-debug'
)

$ErrorActionPreference = 'Stop'

& "$PSScriptRoot\build_flavor.ps1" -Flavor dev -Mode $Mode
