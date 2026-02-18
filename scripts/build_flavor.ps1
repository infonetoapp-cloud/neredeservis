param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('dev', 'stg', 'prod')]
  [string]$Flavor,

  [ValidateSet('apk-debug', 'apk-release')]
  [string]$Mode = 'apk-debug'
)

$ErrorActionPreference = 'Stop'
$fvm = "$env:LOCALAPPDATA\Pub\Cache\bin\fvm.bat"
$java17 = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if (-not (Test-Path $fvm)) {
  throw "fvm.bat bulunamadi: $fvm"
}

if (Test-Path $java17) {
  $env:JAVA_HOME = $java17
  if ($env:Path -notlike "*$java17\bin*") {
    $env:Path = "$java17\bin;$env:Path"
  }
  $env:GRADLE_OPTS = "-Dorg.gradle.java.home=`"$java17`""
}

switch ($Flavor) {
  'dev' { $target = 'lib/main_dev.dart' }
  'stg' { $target = 'lib/main_stg.dart' }
  'prod' { $target = 'lib/main_prod.dart' }
  default { throw "Desteklenmeyen flavor: $Flavor" }
}

$envFileCandidates = switch ($Flavor) {
  'dev' { @('.env.dev') }
  'stg' { @('.env.staging', '.env.stg') }
  'prod' { @('.env.prod') }
}

$defineFile = $null
foreach ($candidate in $envFileCandidates) {
  $candidatePath = Join-Path $repoRoot $candidate
  if (Test-Path $candidatePath) {
    $defineFile = $candidatePath
    break
  }
}

$dartDefineArgs = @("--dart-define=APP_FLAVOR=$Flavor")
if ($defineFile) {
  $dartDefineArgs += "--dart-define-from-file=$defineFile"
}

if ($Mode -eq 'apk-release') {
  & $fvm flutter build apk --release --flavor $Flavor -t $target @dartDefineArgs
} else {
  & $fvm flutter build apk --debug --flavor $Flavor -t $target @dartDefineArgs
}
