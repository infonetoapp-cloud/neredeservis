param(
    [Parameter(Mandatory = $false)]
    [string]$BranchName = "release/candidate",
    [Parameter(Mandatory = $false)]
    [string]$LegalReviewFile = "docs/legal_kvkk_review.md",
    [switch]$CreateBranch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Fail($message) {
    Write-Error $message
    exit 2
}

if (-not (Test-Path $LegalReviewFile)) {
    Fail "Legal review dosyasi bulunamadi: $LegalReviewFile"
}

$content = Get-Content $LegalReviewFile -Raw
$hasApproval = $content -match "(?im)^- legal_approval:\s*`?EVET`?\s*$"

if (-not $hasApproval) {
    Fail "KVKK hukuki onay EVET degil. Release branch acma. (090C gate aktif)"
}

Write-Output "KVKK hukuki onay EVET. Release gate gecildi."

if ($CreateBranch) {
    & git checkout -b $BranchName
    Write-Output "Yeni branch olusturuldu: $BranchName"
}
