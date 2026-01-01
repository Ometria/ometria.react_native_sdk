#!/bin/bash

# Deploy documentation to gh-pages branch
# Works for both initial and subsequent deploys

set -e

# Get remote from parent repo
cd "$(dirname "$0")/.."

# Get list of remotes
REMOTES=($(git remote))

if [ ${#REMOTES[@]} -eq 0 ]; then
  echo "❌ No git remotes found"
  exit 1
fi

echo "Select remote to deploy to:"
select REMOTE_NAME in "${REMOTES[@]}"; do
  if [ -n "$REMOTE_NAME" ]; then
    break
  fi
  echo "Invalid selection. Try again."
done

REPO_URL=$(git remote get-url "$REMOTE_NAME")
echo ""
echo "Selected: $REMOTE_NAME ($REPO_URL)"
echo ""

cd documentation

echo "📦 Building documentation..."
pnpm build

echo "🚀 Deploying to gh-pages..."
cd build

# Clean any existing git history
rm -rf .git

# Initialize fresh repo
git init
git checkout -b gh-pages
git add .
git commit -m "Deploy docs - $(date '+%Y-%m-%d %H:%M:%S')"
git remote add origin "$REPO_URL"
git push -f origin gh-pages

echo "✅ Deployed to: $REPO_URL (gh-pages branch)"
