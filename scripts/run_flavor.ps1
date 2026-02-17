param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'stg', 'prod')]
  [string]$Flavor
)

$ErrorActionPreference = 'Stop'
$fvm = "$env:LOCALAPPDATA\Pub\Cache\bin\fvm.bat"
$java17 = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"

if (-not (Test-Path $fvm)) {
  throw "fvm.bat bulunamadi: $fvm"
}

if (Test-Path $java17) {
  $env:JAVA_HOME = $java17
  if ($env:Path -notlike "*$java17\bin*") {
    $env:Path = "$java17\bin;$env:Path"
  }
}

switch ($Flavor) {
  'dev' { $target = 'lib/main_dev.dart' }
  'stg' { $target = 'lib/main_stg.dart' }
  'prod' { $target = 'lib/main_prod.dart' }
  default { throw "Desteklenmeyen flavor: $Flavor" }
}

& $fvm flutter run --flavor $Flavor -t $target
