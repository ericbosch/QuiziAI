# WSL2 Mobile Access Quick Guide

## Quick Solution

### Step 1: Find Your Windows Host IP

Open **PowerShell on Windows** (not WSL) and run:
```powershell
ipconfig | findstr IPv4
```

Look for your Wi-Fi adapter's IPv4 address (usually `192.168.x.x`).

### Step 2: Set Up Port Forwarding

Open **PowerShell as Administrator on Windows** and run:

```powershell
# Get WSL2 IP
$wslIP = (wsl hostname -I).Trim()

# Forward port 3000
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIP

# Allow firewall rule
New-NetFirewallRule -DisplayName "WSL2 Node.js" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Step 3: Start Dev Server

In WSL2, run:
```bash
npm run dev:network
```

### Step 4: Access from Mobile

On your mobile device (same Wi-Fi network):
- Open browser
- Go to: `http://YOUR_WINDOWS_IP:3000`
- Example: `http://192.168.1.100:3000`

## Alternative: Remove Port Forwarding

If you need to remove the port forwarding later:
```powershell
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
```

## Alternative: Use ngrok

If port forwarding is too complex:

1. Install ngrok: https://ngrok.com/download
2. In WSL2:
   ```bash
   npm run dev:network
   ```
3. In another terminal (Windows or WSL2):
   ```bash
   ngrok http 3000
   ```
4. Use the ngrok URL (e.g., `https://abc123.ngrok.io`) on your mobile device
