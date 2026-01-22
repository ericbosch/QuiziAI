# Ngrok Setup for Mobile Testing

## ⚠️ First Time Setup: Authentication Required

ngrok requires a free account. Follow these steps:

### Step 1: Sign Up (Free)
1. Visit: https://dashboard.ngrok.com/signup
2. Sign up with email (free account is sufficient)

### Step 2: Get Your Authtoken
1. After signing up, visit: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken (looks like: `2abc123def456ghi789jkl012mno345pq_6rStUvWxYz7AbC8DeF9GhI0`)

### Step 3: Configure ngrok

**Option A: Use the automated script (easiest)**
```bash
cd /home/krinekk/dev/QuiziAI
./scripts/ngrok-auth-setup.sh
```
Then paste your authtoken when prompted.

**Option B: Manual setup**
```bash
export PATH="$HOME/.local/bin:$PATH"
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

Replace `YOUR_AUTHTOKEN_HERE` with the token you copied.

### Step 4: Verify Setup
```bash
ngrok version
```
Should show your account info.

## Quick Setup (After Authentication)

### Option 1: Install ngrok (if not installed)

**For Windows:**
1. Download from: https://ngrok.com/download
2. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok\`)
3. Add to PATH or use full path

**For WSL2/Linux:**
```bash
# Download ngrok
cd ~
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/
# Or move to ~/.local/bin if you prefer
mkdir -p ~/.local/bin
mv ngrok ~/.local/bin/
export PATH="$HOME/.local/bin:$PATH"
```

### Option 2: Use the setup script

```bash
cd /home/krinekk/dev/QuiziAI
./scripts/setup-ngrok.sh
```

## Manual Usage

### Step 1: Start the dev server (in WSL2)

```bash
cd /home/krinekk/dev/QuiziAI
npm run dev:network
```

Keep this terminal open.

### Step 2: Start ngrok (in another terminal)

**If ngrok is in PATH:**
```bash
ngrok http 3000
```

**If ngrok is in a specific location:**
```bash
# Windows
C:\path\to\ngrok.exe http 3000

# WSL2/Linux
/path/to/ngrok http 3000
# Or if in ~/.local/bin:
~/.local/bin/ngrok http 3000
```

### Step 3: Use the ngrok URL

You'll see output like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Use `https://abc123.ngrok-free.app` on your mobile device!

## Notes

- **Free tier**: ngrok free tier works great for testing
- **HTTPS**: ngrok provides HTTPS automatically (secure)
- **Works anywhere**: Your mobile doesn't need to be on the same network
- **Temporary**: The URL changes each time you restart ngrok (unless you have a paid plan)
- **Keep both running**: Keep both `npm run dev:network` and `ngrok` running

## Troubleshooting

If ngrok shows "tunnel not found":
- Make sure `npm run dev:network` is running first
- Check that port 3000 is not already in use
- Try restarting both services
