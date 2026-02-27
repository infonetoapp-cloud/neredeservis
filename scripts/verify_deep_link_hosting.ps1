param(
  [Parameter(Mandatory = $true)]
  [string]$BaseUrl
)

$ErrorActionPreference = "Stop"

function Assert-True {
  param(
    [Parameter(Mandatory = $true)]
    [bool]$Condition,
    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Assert-ContainsText {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Content,
    [Parameter(Mandatory = $true)]
    [string]$Expected,
    [Parameter(Mandatory = $true)]
    [string]$Context
  )

  Assert-True -Condition $Content.Contains($Expected) -Message "${Context}: beklenen metin bulunamadi -> $Expected"
}

function Invoke-Json {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url
  )

  $raw = Invoke-WebRequest -UseBasicParsing -Uri $Url
  Assert-True -Condition ($raw.StatusCode -eq 200) -Message "HTTP 200 bekleniyordu: $Url (Status=$($raw.StatusCode))"
  return $raw.Content | ConvertFrom-Json
}

$normalizedBase = $BaseUrl.TrimEnd("/")
Write-Host "Deep-link hosting smoke basliyor: $normalizedBase"

$landingUrl = "$normalizedBase/r/AB12CD"
$landingResponse = Invoke-WebRequest -UseBasicParsing -Uri $landingUrl
Assert-True -Condition ($landingResponse.StatusCode -eq 200) -Message "Landing endpoint 200 donmedi: $landingUrl"

$landingHtml = [string]$landingResponse.Content
Assert-ContainsText -Content $landingHtml -Expected 'property="og:title"' -Context "Landing OG title"
Assert-ContainsText -Content $landingHtml -Expected 'property="og:description"' -Context "Landing OG description"
Assert-ContainsText -Content $landingHtml -Expected 'property="og:image"' -Context "Landing OG image"
Assert-ContainsText -Content $landingHtml -Expected 'id="open-app-link"' -Context "Landing app deep-link CTA"
Assert-ContainsText -Content $landingHtml -Expected 'id="srv-code-value"' -Context "Landing SRV placeholder"
Write-Host "OK landing: $landingUrl"

$assetlinksUrl = "$normalizedBase/.well-known/assetlinks.json"
$assetlinks = @(Invoke-Json -Url $assetlinksUrl)
Assert-True -Condition ($assetlinks.Count -ge 1) -Message "assetlinks.json bos olamaz: $assetlinksUrl"
$assetPackages = @($assetlinks | ForEach-Object { $_.target.package_name })

foreach ($requiredPackage in @("com.neredeservis.app.dev", "com.neredeservis.app.stg", "com.neredeservis.app")) {
  Assert-True -Condition ($assetPackages -contains $requiredPackage) -Message "assetlinks.json package eksik: $requiredPackage"
}
Write-Host "OK assetlinks: $assetlinksUrl"

$aasaUrl = "$normalizedBase/.well-known/apple-app-site-association"
$aasaResponse = Invoke-WebRequest -UseBasicParsing -Uri $aasaUrl
Assert-True -Condition ($aasaResponse.StatusCode -eq 200) -Message "apple-app-site-association HTTP 200 donmedi: $aasaUrl"
Write-Host "OK AASA: $aasaUrl"

Write-Host "Deep-link hosting smoke tamamlandi."
