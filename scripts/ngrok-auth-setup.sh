#!/bin/bash
# Script to help set up ngrok authentication

echo "🔐 Ngrok Authentication Setup"
echo ""
echo "You need to:"
echo "1. Sign up for a free ngrok account"
echo "2. Get your authtoken"
echo "3. Configure ngrok with the token"
echo ""

# Check if ngrok is available
export PATH="$HOME/.local/bin:$PATH"
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    exit 1
fi

echo "📝 Step 1: Sign up for ngrok (free)"
echo "   Visit: https://dashboard.ngrok.com/signup"
echo ""
echo "📝 Step 2: Get your authtoken"
echo "   Visit: https://dashboard.ngrok.com/get-started/your-authtoken"
echo "   Copy your authtoken"
echo ""
read -p "Paste your ngrok authtoken here: " authtoken

if [ -z "$authtoken" ]; then
    echo "❌ No authtoken provided"
    exit 1
fi

echo ""
echo "🔧 Configuring ngrok..."
ngrok config add-authtoken "$authtoken"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ngrok authentication configured successfully!"
    echo ""
    echo "🚀 You can now use ngrok:"
    echo "   ngrok http 3000"
    echo ""
    echo "Or use the automated script:"
    echo "   ./start-mobile-test.sh"
else
    echo ""
    echo "❌ Failed to configure authtoken"
    echo "Try running manually:"
    echo "   ngrok config add-authtoken YOUR_TOKEN"
fi
