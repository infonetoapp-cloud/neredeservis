param(
    [string]$DevProjectId = "neredeservis-dev-01",
    [string]$StgProjectId = "neredeservis-stg-01",
    [string]$ProdProjectId = "neredeservis-prod-01",
    [switch]$Enforce
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if (Get-Variable PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

function Resolve-GcloudCmd {
    $cmd = Get-Command gcloud -ErrorAction SilentlyContinue
    if ($cmd) {
        return $cmd.Source
    }

    $fallback = "C:\Users\sinan\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
    if (Test-Path $fallback) {
        return $fallback
    }

    throw "gcloud bulunamadi. PATH'e ekle veya Cloud SDK kur."
}

function Get-AccessToken {
    param([string]$GcloudCmd)
    $token = & $GcloudCmd auth print-access-token
    if (-not $token) {
        throw "gcloud access token alinamadi."
    }
    return $token.Trim()
}

function Get-FirebaseApps {
    param([string]$ProjectId)
    $raw = cmd /c "firebase apps:list --project $ProjectId --json 2>nul"
    $parsed = $raw | ConvertFrom-Json
    if (-not $parsed.result) {
        return @()
    }
    return $parsed.result
}

function Invoke-AppCheckApi {
    param(
        [string]$Method,
        [string]$Uri,
        [string]$AccessToken,
        [string]$ProjectNumber
    )

    return Invoke-RestMethod `
        -Method $Method `
        -Uri $Uri `
        -Headers @{
            Authorization = "Bearer $AccessToken"
            "x-goog-user-project" = $ProjectNumber
        }
}

function Get-AppDebugTokens {
    param(
        [string]$AccessToken,
        [string]$AppId,
        [string]$ProjectNumber
    )

    $encodedAppId = [System.Uri]::EscapeDataString($AppId)
    $uri = "https://firebaseappcheck.googleapis.com/v1/projects/$ProjectNumber/apps/$encodedAppId/debugTokens"
    $response = Invoke-AppCheckApi -Method "GET" -Uri $uri -AccessToken $AccessToken -ProjectNumber $ProjectNumber
    $tokens = $null
    try {
        $tokens = $response.debugTokens
    } catch {
        $tokens = $null
    }
    if ($tokens) {
        return @($tokens)
    }
    return @()
}

function Remove-AppDebugToken {
    param(
        [string]$AccessToken,
        [string]$ProjectNumber,
        [string]$DebugTokenName
    )

    $uri = "https://firebaseappcheck.googleapis.com/v1/$DebugTokenName"
    Invoke-AppCheckApi -Method "DELETE" -Uri $uri -AccessToken $AccessToken -ProjectNumber $ProjectNumber | Out-Null
}

function Audit-Project {
    param(
        [string]$ProjectId,
        [string]$Environment,
        [string]$AccessToken,
        [bool]$DeleteTokens
    )

    $rows = @()
    $apps = Get-FirebaseApps -ProjectId $ProjectId
    foreach ($app in $apps) {
        $projectNumber = ($app.appId -split ":")[1]
        $tokens = @(Get-AppDebugTokens -AccessToken $AccessToken -AppId $app.appId -ProjectNumber $projectNumber)

        $deleted = 0
        if ($DeleteTokens -and @($tokens).Count -gt 0) {
            foreach ($token in $tokens) {
                Remove-AppDebugToken -AccessToken $AccessToken -ProjectNumber $projectNumber -DebugTokenName $token.name
                $deleted++
            }
            $tokens = @(Get-AppDebugTokens -AccessToken $AccessToken -AppId $app.appId -ProjectNumber $projectNumber)
        }

        $rows += [PSCustomObject]@{
            environment = $Environment
            projectId = $ProjectId
            platform = $app.platform
            appId = $app.appId
            debugTokenCount = @($tokens).Count
            deletedCount = $deleted
        }
    }
    return $rows
}

$gcloudCmd = Resolve-GcloudCmd
$accessToken = Get-AccessToken -GcloudCmd $gcloudCmd

$result = @()
$result += Audit-Project -ProjectId $DevProjectId -Environment "dev" -AccessToken $accessToken -DeleteTokens:$false
$result += Audit-Project -ProjectId $StgProjectId -Environment "stg" -AccessToken $accessToken -DeleteTokens:$Enforce
$result += Audit-Project -ProjectId $ProdProjectId -Environment "prod" -AccessToken $accessToken -DeleteTokens:$Enforce

$result | Sort-Object environment, platform | Format-Table -AutoSize

if ($Enforce) {
    $remainingStgProd = @($result | Where-Object { $_.environment -in @("stg", "prod") -and $_.debugTokenCount -gt 0 })
    if (@($remainingStgProd).Count -gt 0) {
        throw "Enforce sonrasi stg/prod debug token sifirlanamadi."
    }
}

Write-Output "App Check debug token audit tamamlandi. Enforce=$Enforce"
