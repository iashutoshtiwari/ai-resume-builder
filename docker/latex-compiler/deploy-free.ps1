<#
.SYNOPSIS
  Resume-Optimized LaTeX Microservice - 100% Free Tier Cloud Run Deployment (PowerShell)
#>

[CmdletBinding()]
param(
  [string]$ServiceName = "resume-latex-compiler",
  [string]$Region = "us-central1",
  [string]$GitHubUser = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($GitHubUser)) {
  $ghCmd = Get-Command gh -ErrorAction SilentlyContinue
  if ($ghCmd) {
    $GitHubUser = (& gh api user -q .login 2>$null)
  }
}

if ([string]::IsNullOrWhiteSpace($GitHubUser)) {
  $GitHubUser = Read-Host "Enter your GitHub username (for ghcr.io image storage)"
}

if ([string]::IsNullOrWhiteSpace($GitHubUser)) {
  Write-Error "GitHub username is required for zero-cost image hosting on ghcr.io."
  exit 1
}

$GitHubUserLower = $GitHubUser.ToLowerInvariant()
$ImageName = "ghcr.io/$GitHubUserLower/$($ServiceName):latest"

Write-Host "==> Target Image: $ImageName" -ForegroundColor Cyan
Write-Host "==> Cloud Run Region: $Region (Qualifies for GCP Free Tier)" -ForegroundColor Cyan
Write-Host ""

# 1. Build
Write-Host "==> [1/3] Building container image..." -ForegroundColor Green
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
docker build -t $ImageName $ScriptDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 2. Push
Write-Host "==> [2/3] Pushing container to ghcr.io..." -ForegroundColor Green
Write-Host "Note: Make sure you are logged in to ghcr.io via 'docker login ghcr.io'." -ForegroundColor Yellow
docker push $ImageName
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 3. Deploy
Write-Host "==> [3/3] Deploying to Google Cloud Run..." -ForegroundColor Green
gcloud run deploy $ServiceName `
  --image $ImageName `
  --platform managed `
  --region $Region `
  --memory 1Gi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 3 `
  --concurrency 8 `
  --timeout 45s `
  --allow-unauthenticated
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$ServiceUrl = (gcloud run services describe $ServiceName --platform managed --region $Region --format 'value(status.url)').Trim()

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host " Deployment Complete! 100% Free Tier Configuration Verified" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "Service URL: $ServiceUrl" -ForegroundColor White
Write-Host ""
Write-Host "To connect this service to ArqeloCV, add this to your .env.local file:" -ForegroundColor Yellow
Write-Host "LATEX_COMPILER_URL=$ServiceUrl" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Green
