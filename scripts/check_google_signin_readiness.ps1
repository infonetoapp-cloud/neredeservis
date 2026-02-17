param(
  [string[]]$Projects = @(
    "neredeservis-dev-01",
    "neredeservis-stg-01",
    "neredeservis-prod-01"
  )
)

$ErrorActionPreference = "Stop"

$gcloud = "C:\Users\sinan\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (-not (Test-Path $gcloud)) {
  throw "gcloud bulunamadi: $gcloud"
}

function Get-AccessToken {
  $token = & $gcloud auth print-access-token
  if (-not $token) {
    throw "Access token alinamadi. gcloud auth login gerekli olabilir."
  }
  return $token.Trim()
}

function Get-GoogleProviderClientId {
  param(
    [string]$ProjectId,
    [string]$Token
  )

  $uri = "https://identitytoolkit.googleapis.com/admin/v2/projects/$ProjectId/defaultSupportedIdpConfigs/google.com"
  $resp = Invoke-RestMethod -Method GET -Uri $uri -Headers @{
    Authorization = "Bearer $Token"
    "x-goog-user-project" = $ProjectId
  }
  return $resp.clientId
}

function Get-AppsForProject {
  param([string]$ProjectId)

  $raw = firebase apps:list --project $ProjectId --json
  $parsed = $raw | ConvertFrom-Json
  if ($parsed.status -ne "success") {
    throw "firebase apps:list basarisiz: $ProjectId"
  }
  return $parsed.result
}

function Test-AndroidConfig {
  param(
    [string]$ProjectId,
    [string]$AppId
  )

  $raw = firebase apps:sdkconfig android $AppId --project $ProjectId
  $json = $raw | ConvertFrom-Json
  $clients = @($json.client)
  if ($clients.Count -eq 0) {
    return $false
  }
  $oauthItems = @($clients[0].oauth_client)
  return ($oauthItems.Count -gt 0)
}

function Test-IosConfig {
  param(
    [string]$ProjectId,
    [string]$AppId
  )

  $raw = firebase apps:sdkconfig ios $AppId --project $ProjectId
  $hasClientId = $raw -match "<key>CLIENT_ID</key>"
  $hasReversed = $raw -match "<key>REVERSED_CLIENT_ID</key>"
  return ($hasClientId -and $hasReversed)
}

$token = Get-AccessToken
$results = @()

foreach ($project in $Projects) {
  try {
    $providerClientId = Get-GoogleProviderClientId -ProjectId $project -Token $token
    $providerLooksStandard = $providerClientId -match "\.apps\.googleusercontent\.com$"

    $apps = Get-AppsForProject -ProjectId $project
    $androidApp = $apps | Where-Object { $_.platform -eq "ANDROID" } | Select-Object -First 1
    $iosApp = $apps | Where-Object { $_.platform -eq "IOS" } | Select-Object -First 1

    if (-not $androidApp) { throw "ANDROID app kaydi yok: $project" }
    if (-not $iosApp) { throw "IOS app kaydi yok: $project" }

    $androidHasOauthClient = Test-AndroidConfig -ProjectId $project -AppId $androidApp.appId
    $iosHasClientIds = Test-IosConfig -ProjectId $project -AppId $iosApp.appId

    $status = if ($providerLooksStandard -and $androidHasOauthClient -and $iosHasClientIds) {
      "PASS"
    } else {
      "FAIL"
    }

    $results += [pscustomobject]@{
      project = $project
      providerClientId = $providerClientId
      providerClientIdStandard = $providerLooksStandard
      androidOauthClientPresent = $androidHasOauthClient
      iosClientIdPresent = $iosHasClientIds
      status = $status
    }
  } catch {
    $results += [pscustomobject]@{
      project = $project
      providerClientId = "ERROR"
      providerClientIdStandard = $false
      androidOauthClientPresent = $false
      iosClientIdPresent = $false
      status = "ERROR: $($_.Exception.Message)"
    }
  }
}

$results | Format-Table -AutoSize | Out-Host

$failed = @($results | Where-Object { $_.status -ne "PASS" })
if ($failed.Count -gt 0) {
  Write-Error "Google Sign-In readiness FAIL. Ayrintilar yukarida."
  exit 2
}

Write-Host "Google Sign-In readiness PASS."

