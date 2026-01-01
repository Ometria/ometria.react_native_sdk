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

# Extract repo name from URL for baseUrl
# Handles both SSH (git@github.com:user/repo.git) and HTTPS (https://github.com/user/repo.git)
REPO_NAME=$(echo "$REPO_URL" | sed -E 's/.*[\/:]([^\/]+)\.git$/\1/' | sed 's/\.git$//')

# Extract GitHub username/org for site URL
GH_USER=$(echo "$REPO_URL" | sed -E 's/.*[\/:]([^\/]+)\/[^\/]+\.git$/\1/' | sed -E 's/.*github\.com\/([^\/]+)\/.*/\1/')

echo ""
echo "Selected: $REMOTE_NAME"
echo "Repo: $REPO_NAME"
echo "URL will be: https://$GH_USER.github.io/$REPO_NAME/"
echo ""

cd documentation

echo "📦 Building documentation..."
SITE_URL="https://$GH_USER.github.io" BASE_URL="/$REPO_NAME/" pnpm build

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

echo "✅ Deployed to: https://$GH_USER.github.io/$REPO_NAME/"
