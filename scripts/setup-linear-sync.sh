#!/usr/bin/env bash
# setup-linear-sync.sh
# Configures GitHub repository secrets required for Linear sync.
# Run this once locally after cloning the repo.
#
# Usage:
#   ./scripts/setup-linear-sync.sh
#
# Prerequisites:
#   - GitHub CLI authenticated (gh auth login)
#   - LINEAR_API_KEY  — from https://linear.app/settings/api
#   - LINEAR_TEAM_ID  — your Linear team's UUID (optional; auto-detected if blank)

set -euo pipefail

REPO="dromero14521/Apex-Automation-Agency"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BOLD}GitHub ↔ Linear Sync Setup${NC}"
echo "================================================="
echo ""

# ── Prerequisites check ──────────────────────────────────────────────────────
if ! command -v gh &>/dev/null; then
  echo -e "${RED}✗ GitHub CLI not found. Install from https://cli.github.com${NC}"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo -e "${RED}✗ GitHub CLI not authenticated. Run: gh auth login${NC}"
  exit 1
fi

echo -e "${GREEN}✓ GitHub CLI authenticated${NC}"

# ── Collect secrets ──────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Enter your Linear credentials:${NC}"
echo -e "  Get your API key at: https://linear.app/settings/api"
echo ""

read -r -p "  LINEAR_API_KEY (lin_api_...): " LINEAR_API_KEY
if [[ -z "$LINEAR_API_KEY" ]]; then
  echo -e "${RED}✗ LINEAR_API_KEY is required${NC}"
  exit 1
fi

read -r -p "  LINEAR_TEAM_ID (UUID, press Enter to auto-detect): " LINEAR_TEAM_ID

# ── Set GitHub Secrets ────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Setting GitHub repository secrets...${NC}"

gh secret set LINEAR_API_KEY \
  --repo "$REPO" \
  --body "$LINEAR_API_KEY"
echo -e "${GREEN}  ✓ LINEAR_API_KEY set${NC}"

if [[ -n "$LINEAR_TEAM_ID" ]]; then
  gh secret set LINEAR_TEAM_ID \
    --repo "$REPO" \
    --body "$LINEAR_TEAM_ID"
  echo -e "${GREEN}  ✓ LINEAR_TEAM_ID set${NC}"
else
  echo -e "${YELLOW}  ⚠ LINEAR_TEAM_ID not set — sync scripts will auto-detect your first team${NC}"
fi

# ── Verify workflow files exist ───────────────────────────────────────────────
echo ""
echo -e "${BOLD}Verifying workflow files...${NC}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REQUIRED_FILES=(
  ".github/workflows/linear-sync.yml"
  "sync-config.yml"
  "scripts/sync-to-linear.py"
  "scripts/sync-scheduled.py"
)

for f in "${REQUIRED_FILES[@]}"; do
  if [[ -f "$REPO_ROOT/$f" ]]; then
    echo -e "${GREEN}  ✓ $f${NC}"
  else
    echo -e "${RED}  ✗ $f missing — run this script from the repo root${NC}"
  fi
done

# ── List current secrets ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Current repository secrets:${NC}"
gh secret list --repo "$REPO" | while IFS= read -r line; do
  echo "  $line"
done

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Push your changes: git add -A && git commit -m 'feat: add Linear sync automation'"
echo "  2. Monitor the first sync run in GitHub Actions:"
echo "     https://github.com/$REPO/actions/workflows/linear-sync.yml"
echo "  3. Trigger a manual full sync:"
echo "     gh workflow run linear-sync.yml --repo $REPO --field sync_type=full"
echo ""
echo "Troubleshooting:"
echo "  - Check sync artifacts in GitHub Actions for sync-report.json"
echo "  - View workflow logs at: https://github.com/$REPO/actions"
