# QuiziAI 🧠

AI-powered trivia experience using Wikipedia and Gemini 2.5/3 (with Groq + Hugging Face fallback).

> 📖 **Quick Context Recovery:** See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for architecture, data flow, and key patterns.

## Setup

### Prerequisites

- Node.js 18.17.0 or higher (recommended: Node.js 20 LTS)
- npm (comes with Node.js)

**If Node.js is not installed:**

Install using nvm (Node Version Manager):
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell or run:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js 20 LTS
nvm install 20
nvm use 20
```

### Installation

1. Install dependencies:
```bash
npm install
```

**Note:** If you see deprecation warnings, they're safe to ignore. The vulnerabilities reported are in dev dependencies (ESLint) and don't affect runtime.

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Add your AI provider API keys to `.env.local` (at least one required):
```
# Primary: Gemini (may have quota limits)
GEMINI_API_KEY=your_api_key_here

# Free fallback: Groq (very fast, free tier)
GROQ_API_KEY=your_groq_api_key_here

# Free fallback: Hugging Face (rate-limited, free tier)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Optional: override HF model (must be supported by hf-inference text-generation)
# The provider uses the HF router chat endpoint and appends ":hf-inference"
# HUGGINGFACE_MODEL=HuggingFaceTB/SmolLM3-3B
```

**Get API keys:**
- Gemini: https://makersuite.google.com/app/apikey
- Groq: https://console.groq.com/keys (free tier, very fast)
- Hugging Face: https://huggingface.co/settings/tokens (free tier, ~300 req/hour)
  - Supported hf-inference models: https://huggingface.co/models?inference_provider=hf-inference&sort=trending

The app will automatically try providers in order: Gemini → Groq → Hugging Face if quota is exceeded.

## Development

### Running the Development Server

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Testing on Mobile Device

To test the app on your mobile device:

1. **Start the dev server with network access:**
   ```bash
   npm run dev:network
   ```

2. **Find your computer's local IP address:**
   
   **On Linux/WSL:**
   ```bash
   ip addr show | grep "inet " | grep -v 127.0.0.1
   ```
   Or:
   ```bash
   hostname -I
   ```
   
   **On Windows (PowerShell):**
   ```powershell
   ipconfig | findstr IPv4
   ```
   
   **On macOS:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   
   Look for an IP address like `192.168.x.x` or `10.0.x.x`

3. **Connect your mobile device:**
   - Make sure your mobile device is on the **same Wi-Fi network** as your computer
   - Open a browser on your mobile device
   - Navigate to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

4. **WSL2 Special Instructions:**
   
   WSL2 uses a virtual network, so you need to use your **Windows host IP**, not the WSL2 IP.
   
   **Option A: Find Windows Host IP (Recommended)**
   
   On Windows (PowerShell or CMD), run:
   ```powershell
   ipconfig
   ```
   Look for your Wi-Fi adapter (usually "Wireless LAN adapter Wi-Fi") and find the IPv4 address (usually `192.168.x.x`).
   
   Use that IP on your mobile: `http://192.168.x.x:3000`
   
   **Option B: Set up Port Forwarding (If Option A doesn't work)**
   
   On Windows (PowerShell as Administrator), run:
   ```powershell
   # Forward port 3000 from Windows to WSL2
   netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$(wsl hostname -I | awk '{print $1}')
   ```
   
   Then find your Windows Wi-Fi IP (from Option A) and use that on mobile.
   
   **Option C: Use ngrok (Alternative)**
   
   If port forwarding doesn't work, use ngrok for tunneling:
   ```bash
   # Install ngrok: https://ngrok.com/download
   # Then run:
   ngrok http 3000
   ```
   Use the ngrok URL on your mobile device.

5. **Firewall (if needed):**
   - If you can't access it, you may need to allow port 3000 in your firewall
   - On Windows: Open PowerShell as Administrator and run:
     ```powershell
     New-NetFirewallRule -DisplayName "Node.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
     ```
   - On Linux (WSL): Usually not needed, but if using ufw: `sudo ufw allow 3000`

**Troubleshooting ERR_EMPTY_RESPONSE:**

If you get `ERR_EMPTY_RESPONSE`, try these steps:

1. **Verify port forwarding:**
   ```powershell
   # Check existing forwards
   netsh interface portproxy show all
   
   # Remove old forward (if exists)
   netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
   
   # Get current WSL2 IP (run in WSL2)
   # hostname -I | awk '{print $1}'
   
   # Add new forward (replace WSL2_IP with actual IP)
   netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=WSL2_IP
   ```

2. **Verify dev server is binding correctly:**
   - Make sure you're running `npm run dev:network` (not `npm run dev`)
   - Check output shows "Network: http://X.X.X.X:3000"
   - In WSL2, verify: `netstat -tuln | grep 3000` should show `0.0.0.0:3000`

3. **Test from Windows browser first:**
   - Try `http://YOUR_WINDOWS_IP:3000` from Windows browser
   - If this doesn't work, port forwarding isn't set up correctly

4. **If still failing, use ngrok (most reliable):**
   
   **First time setup (authentication required):**
   ```bash
   # 1. Sign up (free): https://dashboard.ngrok.com/signup
   # 2. Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
   # 3. Configure:
   cd /home/krinekk/dev/QuiziAI
   ./scripts/ngrok-auth-setup.sh
   # Or manually: ngrok config add-authtoken YOUR_TOKEN
   ```
   
   **Then use ngrok:**
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   ngrok http 3000
   # Use the ngrok URL on mobile (works from anywhere)
   ```

See `TROUBLESHOOTING.md` for detailed step-by-step guide.

**Note:** The dev server will show both `localhost` and your network IP in the console when using `dev:network`.

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- Mobile-first design (portrait mode focus)
- Spanish UI (docs/logs in English)
- Wikipedia integration (Spanish Wikipedia API)
- AI-powered trivia generation using Gemini (with Groq + Hugging Face fallback)
- Dark-themed UI with thumb-friendly buttons
- Real-time feedback with fun facts

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Google Generative AI (Gemini 2.5/3) + Groq + Hugging Face

## Testing

Run tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

Coverage report:
```bash
npm run test:coverage
```

Live AI provider smoke tests (requires API keys):
```bash
npm run test:integration:ai
```

## Logging

The app logs all operations to both console and a log file:

- **Log file location:** `logs/quiziai.log`
- **Log rotation:** Automatically rotates when file exceeds 10MB
- **Server-side only:** File logging works only on the server (AI operations, API calls)
- **Client-side:** Browser console logs remain for client-side operations

Logs include:
- AI provider attempts and responses
- Wikipedia API calls and fallbacks
- Error details and stack traces
- Game flow operations

To view logs:
```bash
tail -f logs/quiziai.log
```

## License

This project is private and proprietary.

## Documentation

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Complete architecture guide, data flow, and patterns
- **[QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** - Quick reference card for developers
- **[CURSOR_SETUP.md](./docs/CURSOR_SETUP.md)** - Cursor AI setup + prompt template
- **[PRODUCT_LOG.md](./docs/PRODUCT_LOG.md)** - Development history and decisions
- **[TEST_STATUS.md](./TEST_STATUS.md)** - Test coverage and results

## Version

Current version: **1.0.0-alpha**

See [CHANGELOG.md](./CHANGELOG.md) for version history.
