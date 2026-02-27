param(
  [int]$Port = 3210
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..\..\..")).Path
$webDir = (Resolve-Path (Join-Path $repoRoot "website\apps\web")).Path
$planDir = (Resolve-Path (Join-Path $repoRoot "website\plan")).Path

$timestamp = Get-Date
$dateSlug = $timestamp.ToString("yyyy_MM_dd_HHmm")
$reportPath = Join-Path $planDir ("99_phase8_local_seo_smoke_" + $dateSlug + ".md")

function Wait-ForHttpReady {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 120
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 2
      continue
    }
    Start-Sleep -Seconds 2
  }
  return $false
}

function Invoke-HttpProbe {
  param([string]$Url, [int]$TimeoutSec = 20)

  $status = "ERR"
  $contentType = "-"
  $content = ""
  $note = "-"

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -MaximumRedirection 0
    $status = [string]$response.StatusCode
    if ($response.Headers["Content-Type"]) {
      $contentType = $response.Headers["Content-Type"]
    }
    $content = $response.Content
  } catch {
    if ($_.Exception.Response) {
      $statusCode = [int]$_.Exception.Response.StatusCode.value__
      $status = [string]$statusCode
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

$baseUrl = "http://127.0.0.1:$Port"
$rows = New-Object System.Collections.Generic.List[object]
$devProcess = $null

try {
  $devProcess = Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev", "--", "--port", "$Port") -WorkingDirectory $webDir -PassThru

  if (-not (Wait-ForHttpReady -Url ($baseUrl + "/login") -TimeoutSeconds 120)) {
    Add-CheckResult -Rows $rows -Check "dev server bootstrap" -Passed $false -Detail "Dev server did not become ready"
  } else {
    Add-CheckResult -Rows $rows -Check "dev server bootstrap" -Passed $true -Detail ("ready on " + $baseUrl)

    $marketingRootProbe = Invoke-HttpProbe -Url ($baseUrl + "/")
    Add-CheckResult -Rows $rows -Check "marketing root reachable" `
      -Passed ($marketingRootProbe.Status -eq "200") `
      -Detail ("HTTP=" + $marketingRootProbe.Status + "; content-type=" + $marketingRootProbe.ContentType)

    $contactProbe = Invoke-HttpProbe -Url ($baseUrl + "/iletisim")
    Add-CheckResult -Rows $rows -Check "iletisim reachable" `
      -Passed ($contactProbe.Status -eq "200") `
      -Detail ("HTTP=" + $contactProbe.Status)

    $privacyProbe = Invoke-HttpProbe -Url ($baseUrl + "/gizlilik")
    Add-CheckResult -Rows $rows -Check "gizlilik reachable" `
      -Passed ($privacyProbe.Status -eq "200") `
      -Detail ("HTTP=" + $privacyProbe.Status)

    $kvkkProbe = Invoke-HttpProbe -Url ($baseUrl + "/kvkk")
    Add-CheckResult -Rows $rows -Check "kvkk reachable" `
      -Passed ($kvkkProbe.Status -eq "200") `
      -Detail ("HTTP=" + $kvkkProbe.Status)

    $girisProbe = Invoke-HttpProbe -Url ($baseUrl + "/giris")
    Add-CheckResult -Rows $rows -Check "giris reachable" `
      -Passed ($girisProbe.Status -eq "200") `
      -Detail ("HTTP=" + $girisProbe.Status)

    $robotsProbe = Invoke-HttpProbe -Url ($baseUrl + "/robots.txt")
    $robotsHasSitemap = ($robotsProbe.Content -match "Sitemap:")
    Add-CheckResult -Rows $rows -Check "robots endpoint + sitemap reference" `
      -Passed ($robotsProbe.Status -eq "200" -and $robotsHasSitemap) `
      -Detail ("HTTP=" + $robotsProbe.Status + "; sitemap-ref=" + $robotsHasSitemap)

    $sitemapProbe = Invoke-HttpProbe -Url ($baseUrl + "/sitemap.xml")
    $sitemapHasRoot = ($sitemapProbe.Content -match "<loc>")
    Add-CheckResult -Rows $rows -Check "sitemap endpoint reachable" `
      -Passed ($sitemapProbe.Status -eq "200" -and $sitemapHasRoot) `
      -Detail ("HTTP=" + $sitemapProbe.Status + "; has-loc=" + $sitemapHasRoot)

    $ogProbe = Invoke-HttpProbe -Url ($baseUrl + "/opengraph-image")
    $ogIsImage = ($ogProbe.ContentType -match "image/")
    Add-CheckResult -Rows $rows -Check "opengraph image reachable" `
      -Passed ($ogProbe.Status -eq "200" -and $ogIsImage) `
      -Detail ("HTTP=" + $ogProbe.Status + "; content-type=" + $ogProbe.ContentType)

    $twitterProbe = Invoke-HttpProbe -Url ($baseUrl + "/twitter-image")
    $twitterIsImage = ($twitterProbe.ContentType -match "image/")
    Add-CheckResult -Rows $rows -Check "twitter image reachable" `
      -Passed ($twitterProbe.Status -eq "200" -and $twitterIsImage) `
      -Detail ("HTTP=" + $twitterProbe.Status + "; content-type=" + $twitterProbe.ContentType)

    $manifestProbe = Invoke-HttpProbe -Url ($baseUrl + "/manifest.webmanifest")
    $manifestLooksJson = ($manifestProbe.ContentType -match "json" -or $manifestProbe.Content -match '"name"')
    Add-CheckResult -Rows $rows -Check "manifest reachable" `
      -Passed ($manifestProbe.Status -eq "200" -and $manifestLooksJson) `
      -Detail ("HTTP=" + $manifestProbe.Status + "; content-type=" + $manifestProbe.ContentType)

    $panelLoginProbe = Invoke-HttpProbe -Url ($baseUrl + "/login")
    Add-CheckResult -Rows $rows -Check "panel login reachable" `
      -Passed ($panelLoginProbe.Status -eq "200") `
      -Detail ("HTTP=" + $panelLoginProbe.Status)
  }
} finally {
  if ($devProcess -and -not $devProcess.HasExited) {
    cmd /c ("taskkill /PID " + $devProcess.Id + " /T /F") | Out-Null
  }
}

$failed = $rows | Where-Object { $_.Status -eq "FAIL" }
$overall = if ($failed.Count -eq 0) { "PASS" } else { "FAIL" }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Faz 8 Local SEO Smoke Report") | Out-Null
$lines.Add("") | Out-Null
$lines.Add("Tarih: " + $timestamp.ToString("yyyy-MM-dd HH:mm:ss")) | Out-Null
$lines.Add("Durum: " + $overall) | Out-Null
$lines.Add("Base URL: " + $baseUrl) | Out-Null
$lines.Add("") | Out-Null
$lines.Add("| Check | Status | Detail |") | Out-Null
$lines.Add("| --- | --- | --- |") | Out-Null
foreach ($row in $rows) {
  $lines.Add("| " + $row.Check + " | " + $row.Status + " | " + $row.Detail + " |") | Out-Null
}
$lines.Add("") | Out-Null
$lines.Add("Not:") | Out-Null
$lines.Add("- Bu smoke sadece lokal build/dev akisinda Faz 8 SEO endpointlerinin calistigini dogrular.") | Out-Null
$lines.Add("- Canli ortam 404 bulgulari deploy penceresinde `smoke:phase8:seo` ile kapanacaktir.") | Out-Null

Set-Content -Path $reportPath -Value $lines -Encoding ascii
Write-Host ("[PHASE8-LOCAL] report -> " + $reportPath) -ForegroundColor Green

if ($overall -eq "PASS") {
  exit 0
}
exit 1

