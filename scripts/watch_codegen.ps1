Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

& .\.fvm\flutter_sdk\bin\dart.bat run build_runner watch -d
