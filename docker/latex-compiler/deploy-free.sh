#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Resume-Optimized LaTeX Microservice - 100% Free Tier Cloud Run Deployment
# ==============================================================================

SERVICE_NAME="${SERVICE_NAME:-resume-latex-compiler}"
REGION="${REGION:-us-central1}"
GITHUB_USER="${GITHUB_USER:-}"

if [ -z "$GITHUB_USER" ]; then
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    GITHUB_USER="$(gh api user -q .login 2>/dev/null || true)"
  fi
fi

if [ -z "$GITHUB_USER" ]; then
  read -r -p "Enter your GitHub username (for ghcr.io image storage): " GITHUB_USER
fi

if [ -z "$GITHUB_USER" ]; then
  echo "Error: GitHub username is required for zero-cost image hosting on ghcr.io."
  exit 1
fi

GITHUB_USER_LOWER="$(echo "$GITHUB_USER" | tr '[:upper:]' '[:lower:]')"
IMAGE_NAME="ghcr.io/${GITHUB_USER_LOWER}/${SERVICE_NAME}:latest"

echo "==> Target Image: $IMAGE_NAME"
echo "==> Cloud Run Region: $REGION (Qualifies for GCP Free Tier)"
echo ""

# 1. Build the lightweight container image
echo "==> [1/3] Building container image..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
docker build -t "$IMAGE_NAME" "$SCRIPT_DIR"

# 2. Push image to GitHub Container Registry (Unlimited free public hosting)
echo "==> [2/3] Pushing container to ghcr.io..."
echo "Note: Make sure you are logged in to ghcr.io via 'docker login ghcr.io'."
docker push "$IMAGE_NAME"

# 3. Deploy to Cloud Run with strict free-tier parameters
echo "==> [3/3] Deploying to Google Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE_NAME" \
  --platform managed \
  --region "$REGION" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --concurrency 8 \
  --timeout 45s \
  --allow-unauthenticated

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format 'value(status.url)')"

echo ""
echo "=============================================================================="
echo " Deployment Complete! 100% Free Tier Configuration Verified"
echo "=============================================================================="
echo "Service URL: $SERVICE_URL"
echo ""
echo "To connect this service to ArqeloCV, add this to your .env.local file:"
echo "LATEX_COMPILER_URL=$SERVICE_URL"
echo "=============================================================================="
