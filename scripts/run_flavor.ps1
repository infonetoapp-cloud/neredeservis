param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'stg', 'prod')]
  [string]$Flavor
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

& $fvm flutter run --flavor $Flavor -t $target
