#!/bin/bash
# Quick script to start dev server and ngrok for mobile testing

echo "🚀 Starting QuiziAI for mobile testing..."
echo ""

# Add ngrok to PATH if not already there
export PATH="$HOME/.local/bin:$PATH"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed!"
    echo ""
    echo "Installing ngrok..."
    mkdir -p ~/.local/bin
    cd ~/.local/bin
    
    if [ ! -f ngrok ]; then
        echo "Downloading ngrok..."
        wget -q https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz -O ngrok.tgz
        if [ -f ngrok.tgz ]; then
            tar -xzf ngrok.tgz
            rm ngrok.tgz
            chmod +x ngrok
            echo "✅ ngrok installed!"
        else
            echo "❌ Failed to download ngrok"
            echo "Please download manually from: https://ngrok.com/download"
            exit 1
        fi
    fi
fi

# Check if dev server is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3000 is already in use"
    echo "Please stop the existing server first"
    exit 1
fi

# Get the project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📦 Starting Next.js dev server..."
echo ""

# Start dev server in background
npm run dev:network > /tmp/quiziai-dev.log 2>&1 &
DEV_PID=$!

# Wait a bit for server to start
sleep 3

# Check if server started successfully
if ! kill -0 $DEV_PID 2>/dev/null; then
    echo "❌ Dev server failed to start"
    cat /tmp/quiziai-dev.log
    exit 1
fi

echo "✅ Dev server started (PID: $DEV_PID)"
echo ""
echo "🌐 Starting ngrok tunnel..."
echo "📱 Your mobile URL will appear below:"
echo ""

# Start ngrok
ngrok http 3000

# Cleanup on exit
trap "kill $DEV_PID 2>/dev/null; exit" INT TERM
