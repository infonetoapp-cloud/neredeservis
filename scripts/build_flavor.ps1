param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'stg', 'prod')]
  [string]$Flavor,

  [ValidateSet('apk-debug', 'apk-release')]
  [string]$Mode = 'apk-debug'
)

$ErrorActionPreference = 'Stop'
$fvm = "$env:LOCALAPPDATA\Pub\Cache\bin\fvm.bat"

if (-not (Test-Path $fvm)) {
  throw "fvm.bat bulunamadi: $fvm"
}

switch ($Flavor) {
  'dev' { $target = 'lib/main_dev.dart' }
  'stg' { $target = 'lib/main_stg.dart' }
  'prod' { $target = 'lib/main_prod.dart' }
  default { throw "Desteklenmeyen flavor: $Flavor" }
}

if ($Mode -eq 'apk-release') {
  & $fvm flutter build apk --release --flavor $Flavor -t $target
} else {
  & $fvm flutter build apk --debug --flavor $Flavor -t $target
}
