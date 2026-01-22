#!/bin/bash
# Setup script for ngrok tunneling

echo "🔧 Setting up ngrok for QuiziAI mobile testing..."

# Check if ngrok is installed
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok is already installed"
    ngrok version
else
    echo "❌ ngrok is not installed"
    echo ""
    echo "To install ngrok:"
    echo "1. Download from: https://ngrok.com/download"
    echo "2. Extract the ngrok executable"
    echo "3. Add to PATH or place in ~/bin or ~/.local/bin"
    echo ""
    echo "Or install via package manager:"
    echo "  - Windows: choco install ngrok"
    echo "  - Linux/WSL: Download from https://ngrok.com/download"
    echo ""
    exit 1
fi

echo ""
echo "🚀 Starting ngrok tunnel..."
echo "📱 Use the URL shown below on your mobile device"
echo ""

# Start ngrok
ngrok http 3000
