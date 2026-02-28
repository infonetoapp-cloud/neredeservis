param(
  [string]$MarketingBaseUrl = "https://neredeservis.app",
  [string]$WwwBaseUrl = "https://www.neredeservis.app",
  [string]$PanelBaseUrl = "https://app.neredeservis.app",
  [switch]$FailOnPartial
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("98_phase8_marketing_seo_smoke_" + $dateSlug + ".md")

function Invoke-HttpProbe {
  param([string]$Url, [int]$TimeoutSec = 20)

  $status = "ERR"
  $location = "-"
  $contentType = "-"
  $content = ""
  $note = "-"

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -MaximumRedirection 0
    $status = [string]$response.StatusCode
    if ($response.Headers["Location"]) {
      $location = $response.Headers["Location"]
    }
    if ($response.Headers["Content-Type"]) {
      $contentType = $response.Headers["Content-Type"]
    }
    $content = $response.Content
  } catch {
    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode.value__
      $status = [string]$statusCode
      try {
        $locationHeader = $_.Exception.Response.Headers["Location"]
        if ($locationHeader) {
          $location = $locationHeader
        }
      } catch {
        $location = "-"
      }
      try {
        $ct = $_.Exception.Response.Headers["Content-Type"]
        if ($ct) {
          $contentType = $ct
        }
      } catch {
        $contentType = "-"
      }
      try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $content = $reader.ReadToEnd()
        $reader.Close()
      } catch {
        $content = ""
      }
      $note = "HTTP redirect/error response"
    } else {
      $note = $_.Exception.Message
    }
  }

  return [PSCustomObject]@{
    Url = $Url
    Status = $status
    Location = $location
    ContentType = $contentType
    Content = $content
    Note = $note
  }
}

function Add-CheckResult {
  param(
    [System.Collections.Generic.List[object]]$Rows,
    [string]$Check,
    [bool]$Passed,
    [string]$Detail
  )

  $Rows.Add([PSCustomObject]@{
      Check = $Check
      Status = $(if ($Passed) { "PASS" } else { "FAIL" })
      Detail = $Detail
    }) | Out-Null
}

$rows = New-Object System.Collections.Generic.List[object]

$marketingRootProbe = Invoke-HttpProbe -Url ($MarketingBaseUrl + "/")
Add-CheckResult -Rows $rows -Check "marketing root reachable" `
  -Passed ($marketingRootProbe.Status -eq "200") `
  -Detail ("HTTP=" + $marketingRootProbe.Status + "; content-type=" + $marketingRootProbe.ContentType)

$contactProbe = Invoke-HttpProbe -Url ($MarketingBaseUrl + "/iletisim")
Add-CheckResult -Rows $rows -Check "iletisim reachable" `
  -Passed ($contactProbe.Status -eq "200") `
  -Detail ("HTTP=" + $contactProbe.Status)

$privacyProbe = Invoke-HttpProbe -Url ($MarketingBaseUrl + "/gizlilik")
Add-CheckResult -Rows $rows -Check "gizlilik reachable" `
  -Passed ($privacyProbe.Status -eq "200") `
  -Detail ("HTTP=" + $privacyProbe.Status)

$kvkkProbe = Invoke-HttpProbe -Url ($MarketingBaseUrl + "/kvkk")
Add-CheckResult -Rows $rows -Check "kvkk reachable" `
  -Passed ($kvkkProbe.Status -eq "200") `
  -Detail ("HTTP=" + $kvkkProbe.Status)

$robotsProbe = Invoke-HttpProbe -Url ($MarketingBaseUrl + "/robots.txt")
$robotsHasSitemap = ($robotsProbe.Content -match "Sitemap:\s*https://neredeservis\.app/sitemap\.xml")
Add-CheckResult -Rows $rows -Check "robots endpoint + sitemap reference" `
  -Passed ($robotsProbe.Status -eq "200" -and $robotsHasSitemap) `
  -Detail ("HTTP=" + $robotsProbe.Status + "; sitemap-ref=" + $robotsHasSitemap)

$sitemapProbe = Invoke-HttpProbe -Url ($MarketingBaseUrl + "/sitemap.xml")
$sitemapHasRoot = ($sitemapProbe.Content -match "<loc>https://neredeservis\.app/?</loc>")
Add-CheckResult -Rows $rows -Check "sitemap endpoint + root url" `
  -Passed ($sitemapProbe.Status -eq "200" -and $sitemapHasRoot) `
  -Detail ("HTTP=" + $sitemapProbe.Status + "; root-url=" + $sitemapHasRoot)

$ogProbe = Invoke-HttpProbe -Url ($MarketingBaseUrl + "/opengraph-image")
$ogIsImage = ($ogProbe.ContentType -match "image/")
Add-CheckResult -Rows $rows -Check "opengraph image reachable" `
  -Passed ($ogProbe.Status -eq "200" -and $ogIsImage) `
  -Detail ("HTTP=" + $ogProbe.Status + "; content-type=" + $ogProbe.ContentType)

$twitterProbe = Invoke-HttpProbe -Url ($MarketingBaseUrl + "/twitter-image")
$twitterIsImage = ($twitterProbe.ContentType -match "image/")
Add-CheckResult -Rows $rows -Check "twitter image reachable" `
  -Passed ($twitterProbe.Status -eq "200" -and $twitterIsImage) `
  -Detail ("HTTP=" + $twitterProbe.Status + "; content-type=" + $twitterProbe.ContentType)

$manifestProbe = Invoke-HttpProbe -Url ($MarketingBaseUrl + "/manifest.webmanifest")
$manifestLooksJson = ($manifestProbe.ContentType -match "json" -or $manifestProbe.Content -match '"name"')
Add-CheckResult -Rows $rows -Check "manifest reachable" `
  -Passed ($manifestProbe.Status -eq "200" -and $manifestLooksJson) `
  -Detail ("HTTP=" + $manifestProbe.Status + "; content-type=" + $manifestProbe.ContentType)

$panelLoginProbe = Invoke-HttpProbe -Url ($PanelBaseUrl + "/login")
Add-CheckResult -Rows $rows -Check "panel login reachable" `
  -Passed ($panelLoginProbe.Status -eq "200") `
  -Detail ("HTTP=" + $panelLoginProbe.Status)

$wwwProbe = Invoke-HttpProbe -Url $WwwBaseUrl
$wwwRedirectOk = (
  ($wwwProbe.Status -eq "301" -or $wwwProbe.Status -eq "302" -or $wwwProbe.Status -eq "307" -or $wwwProbe.Status -eq "308") `
    -and $wwwProbe.Location -like "https://neredeservis.app*"
)
Add-CheckResult -Rows $rows -Check "www to apex canonical redirect" `
  -Passed $wwwRedirectOk `
  -Detail ("HTTP=" + $wwwProbe.Status + "; location=" + $wwwProbe.Location)

$failed = $rows | Where-Object { $_.Status -eq "FAIL" }
$overall = if ($failed.Count -eq 0) { "PASS" } else { "PARTIAL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 8 Marketing SEO Smoke Report") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Check | Status | Detail |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
foreach ($row in $rows) {
  $lines.Add("| " + $row.Check + " | " + $row.Status + " | " + $row.Detail + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("Not:") | Out-Null
$lines.Add("- Bu smoke SEO/metadata endpoint erisimi ve canonical redirect davranisini dogrular.") | Out-Null
$lines.Add("- Faz 8 landing polish kapsaminda sosyal onizleme + sitemap + robots + manifest butunlugu icin operasyonel kanittir.") | Out-Null

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[PHASE8] report -> " + $reportPath) -ForegroundColor Green

if ($overall -eq "PASS") {
  exit 0
}
if ($FailOnPartial) {
  exit 3
}
exit 0
