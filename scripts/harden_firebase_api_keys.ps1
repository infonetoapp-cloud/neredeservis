param(
  [ValidateSet("backup", "apply", "verify")]
  [string]$Mode = "backup"
)

$ErrorActionPreference = "Stop"

$gcloud = "C:\Users\sinan\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $gcloud)) {
  throw "gcloud bulunamadi: $gcloud"
}

$projects = @(
  "neredeservis-dev-01",
  "neredeservis-stg-01",
  "neredeservis-prod-01"
)

# Conservative allowlist: covers current + near-term Firebase mobile runtime needs.
$allowedServices = @(
  "firebase.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firestore.googleapis.com",
  "firebasedatabase.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "firebaseappcheck.googleapis.com",
  "firebaseremoteconfig.googleapis.com",
  "firebaseremoteconfigrealtime.googleapis.com",
  "firebasestorage.googleapis.com",
  "fcmregistrations.googleapis.com",
  "fpnv.googleapis.com",
  "datastore.googleapis.com"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path "docs" "api_key_backups"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

function Get-ProjectKeysJson {
  param([string]$ProjectId)
  & $gcloud services api-keys list --project=$ProjectId --format=json
}

function Get-KeyDetailsJson {
  param([string]$KeyName)
  & $gcloud services api-keys describe $KeyName --format=json
}

function Build-UpdateArgs {
  param(
    [string]$KeyName,
    [pscustomobject]$Details
  )

  $args = @("services", "api-keys", "update", $KeyName)

  if ($Details.restrictions.androidKeyRestrictions) {
    foreach ($app in $Details.restrictions.androidKeyRestrictions.allowedApplications) {
      $args += "--allowed-application=package_name=$($app.packageName),sha1_fingerprint=$($app.sha1Fingerprint)"
    }
  } elseif ($Details.restrictions.iosKeyRestrictions) {
    $bundleIds = @($Details.restrictions.iosKeyRestrictions.allowedBundleIds) -join ","
    $args += "--allowed-bundle-ids=$bundleIds"
  } elseif ($Details.restrictions.browserKeyRestrictions) {
    $referrers = @($Details.restrictions.browserKeyRestrictions.allowedReferrers) -join ","
    $args += "--allowed-referrers=$referrers"
  } else {
    throw "Desteklenmeyen app restriction tipi: $KeyName"
  }

  foreach ($service in $allowedServices) {
    $args += "--api-target=service=$service"
  }

  return ,$args
}

function Save-Backup {
  $all = @()
  foreach ($project in $projects) {
    $keys = Get-ProjectKeysJson -ProjectId $project | ConvertFrom-Json
    foreach ($k in $keys) {
      $details = Get-KeyDetailsJson -KeyName $k.name | ConvertFrom-Json
      $all += [pscustomobject]@{
        projectId = $project
        keyName = $k.name
        uid = $k.uid
        displayName = $k.displayName
        restrictions = $details.restrictions
      }
    }
  }

  $outFile = Join-Path $backupDir "api_key_restrictions_backup_$timestamp.json"
  $all | ConvertTo-Json -Depth 20 | Out-File -FilePath $outFile -Encoding utf8
  Write-Host "Backup yazildi: $outFile"
}

function Apply-Hardening {
  foreach ($project in $projects) {
    Write-Host "=== APPLY $project ==="
    $keys = Get-ProjectKeysJson -ProjectId $project | ConvertFrom-Json
    foreach ($k in $keys) {
      $details = Get-KeyDetailsJson -KeyName $k.name | ConvertFrom-Json
      $args = Build-UpdateArgs -KeyName $k.name -Details $details
      Write-Host "Updating: $($k.displayName) [$($k.uid)]"
      & $gcloud @args | Out-Host
    }
  }
}

function Verify-Hardening {
  foreach ($project in $projects) {
    Write-Host "=== VERIFY $project ==="
    $keys = Get-ProjectKeysJson -ProjectId $project | ConvertFrom-Json
    foreach ($k in $keys) {
      $details = Get-KeyDetailsJson -KeyName $k.name | ConvertFrom-Json
      $targetServices = @($details.restrictions.apiTargets | ForEach-Object { $_.service })
      $missing = @($allowedServices | Where-Object { $_ -notin $targetServices })
      $extra = @($targetServices | Where-Object { $_ -notin $allowedServices })
      Write-Host "- $($k.displayName) [$($k.uid)]"
      Write-Host "  services=$($targetServices.Count) missing=$($missing.Count) extra=$($extra.Count)"
      if ($missing.Count -gt 0) {
        Write-Host "  missing: $($missing -join ', ')"
      }
      if ($extra.Count -gt 0) {
        Write-Host "  extra: $($extra -join ', ')"
      }
    }
  }
}

switch ($Mode) {
  "backup" { Save-Backup }
  "apply" { Apply-Hardening }
  "verify" { Verify-Hardening }
}
