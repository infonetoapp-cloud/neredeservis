param(
  [Parameter(Mandatory = $true)]
  [string]$DigitalOceanToken,
  [string]$SshPublicKey = "",
  [int[]]$SshKeyIds = @(),
  [string]$DropletName = "neredeservis-maps-dev",
  [string]$Region = "fra1",
  [string]$Size = "s-1vcpu-2gb",
  [string]$Image = "ubuntu-24-04-x64",
  [string]$VpcUuid = "",
  [string]$CloudInitPath = ""
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$defaultCloudInitPath = Join-Path $scriptDir "..\\cloud-init\\maps-dev.user-data.yaml"
$resolvedCloudInitPath = if ($CloudInitPath) { $CloudInitPath } else { $defaultCloudInitPath }

if (-not (Test-Path $resolvedCloudInitPath)) {
  throw "Cloud-init dosyasi bulunamadi: $resolvedCloudInitPath"
}

if (-not $SshPublicKey.Trim() -and $SshKeyIds.Count -eq 0) {
  throw "En az bir SSH erisim yontemi verin: -SshPublicKey veya -SshKeyIds."
}

$cloudInit = Get-Content $resolvedCloudInitPath -Raw
$cloudInit = $cloudInit.Replace("__SSH_PUBLIC_KEY__", $SshPublicKey.Trim())

$body = @{
  name = $DropletName
  region = $Region
  size = $Size
  image = $Image
  tags = @("neredeservis", "maps", "dev")
  user_data = $cloudInit
}

if ($VpcUuid.Trim()) {
  $body.vpc_uuid = $VpcUuid.Trim()
}

if ($SshKeyIds.Count -gt 0) {
  $body.ssh_keys = @($SshKeyIds)
}

$headers = @{
  Authorization = "Bearer $DigitalOceanToken"
  "Content-Type" = "application/json"
}

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.digitalocean.com/v2/droplets" `
  -Headers $headers `
  -Body ($body | ConvertTo-Json -Depth 8)

$response | ConvertTo-Json -Depth 10
