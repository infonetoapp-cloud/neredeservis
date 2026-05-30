param(
  [Parameter(Mandatory = $true)]
  [string]$CloudflareEmail,
  [Parameter(Mandatory = $true)]
  [string]$CloudflareApiKey,
  [Parameter(Mandatory = $true)]
  [string]$ZoneId,
  [Parameter(Mandatory = $true)]
  [string]$RecordName,
  [Parameter(Mandatory = $true)]
  [string]$Ipv4Address,
  [bool]$Proxied = $false
)

$headers = @{
  "X-Auth-Email" = $CloudflareEmail
  "X-Auth-Key" = $CloudflareApiKey
  "Content-Type" = "application/json"
}

$lookupUrl = "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records?type=A&name=$([uri]::EscapeDataString($RecordName))"
$lookup = Invoke-RestMethod -Method Get -Uri $lookupUrl -Headers $headers
$existing = @($lookup.result)[0]

$payload = @{
  type = "A"
  name = $RecordName
  content = $Ipv4Address
  ttl = 120
  proxied = $Proxied
}

if ($existing) {
  $result = Invoke-RestMethod `
    -Method Put `
    -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records/$($existing.id)" `
    -Headers $headers `
    -Body ($payload | ConvertTo-Json -Depth 5)
} else {
  $result = Invoke-RestMethod `
    -Method Post `
    -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/dns_records" `
    -Headers $headers `
    -Body ($payload | ConvertTo-Json -Depth 5)
}

$result | ConvertTo-Json -Depth 8
