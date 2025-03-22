#!/bin/bash

# Deploy to Render helper script
echo "Preparing to deploy to Render..."

# 1. Make sure all the files are executable
chmod +x prepare-production.sh
chmod +x test-build.sh
chmod +x render-deploy.sh

# 2. Run a local test build first
./test-build.sh

# 3. Ask the user if they want to continue
echo ""
echo "The local build has completed. Do you want to continue deploying to Render? (y/n)"
read -r continue_deploy

if [ "$continue_deploy" != "y" ]; then
  echo "Deployment cancelled."
  exit 0
fi

# 4. Commit changes to git
echo "Committing changes to git..."
git add .
git commit -m "Deploy to Render with fixed Prisma schema"

# 5. Push to GitHub
echo "Pushing to GitHub..."
git push origin main

echo "Changes have been pushed to GitHub. Render will automatically deploy the new version."
echo "You can check the deployment status at https://dashboard.render.com" 