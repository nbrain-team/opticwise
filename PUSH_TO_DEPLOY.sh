#!/bin/bash

# Script to push marketing automation changes to GitHub and trigger Render deployment

echo "🚀 OpticWise Marketing Automation - Deployment Script"
echo "======================================================"
echo ""

cd /Users/dannydemichele/Opticwise

# Check current status
echo "📊 Checking git status..."
git status --short
echo ""

# Show what will be pushed
echo "📦 Commits to be pushed:"
git log origin/main..HEAD --oneline
echo ""

# Add any remaining untracked files
echo "📝 Adding remaining documentation files..."
git add DEPLOYMENT_STATUS.md TESTING_CHECKLIST.md 2>/dev/null
git commit -m "Add deployment and testing documentation" 2>/dev/null || echo "No additional files to commit"
echo ""

# Push to GitHub
echo "🔄 Pushing to GitHub..."
echo "You may be prompted for GitHub credentials."
echo ""

git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Monitor Render deployment: https://dashboard.render.com"
    echo "2. Wait 5-10 minutes for build to complete"
    echo "3. Test features:"
    echo "   - https://opticwise-frontend.onrender.com/campaigns"
    echo "   - https://opticwise-frontend.onrender.com/audit-tool"
    echo "   - https://opticwise-frontend.onrender.com/book-request"
    echo "   - https://opticwise-frontend.onrender.com/conferences"
    echo ""
    echo "📚 See TESTING_CHECKLIST.md for detailed testing steps"
else
    echo ""
    echo "❌ Push failed. Please try one of these options:"
    echo ""
    echo "Option 1: Use GitHub Desktop"
    echo "  1. Open GitHub Desktop"
    echo "  2. Click 'Push origin' button"
    echo ""
    echo "Option 2: Generate GitHub Personal Access Token"
    echo "  1. Go to: https://github.com/settings/tokens"
    echo "  2. Generate new token (classic) with 'repo' permissions"
    echo "  3. Run: git push origin main"
    echo "  4. Username: your-github-username"
    echo "  5. Password: paste-your-token"
    echo ""
fi


