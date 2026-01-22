# Troubleshooting ERR_EMPTY_RESPONSE

## Common Causes

1. **Port forwarding not working correctly**
2. **Dev server not binding to 0.0.0.0**
3. **Firewall blocking connections**
4. **WSL2 IP changed**

## Step-by-Step Fix

### 1. Verify Dev Server is Running

In WSL2, make sure you're running:
```bash
npm run dev:network
```

You should see output like:
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
- Network:      http://172.19.x.x:3000
```

### 2. Get Current WSL2 IP

In WSL2, run:
```bash
hostname -I | awk '{print $1}'
```

Note this IP address.

### 3. Check Port Forwarding on Windows

Open PowerShell as Administrator on Windows and check existing port forwards:
```powershell
netsh interface portproxy show all
```

### 4. Remove Old Port Forward (if exists)

```powershell
netsh interface portproxy delete v4tov4 listenport=3000 listenaddress=0.0.0.0
```

### 5. Get WSL2 IP and Set Up Forwarding

In PowerShell (as Administrator):
```powershell
# Get WSL2 IP (replace with actual IP from step 2)
$wslIP = "172.19.205.198"  # Replace with your WSL2 IP

# Add port forward
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIP

# Verify it was added
netsh interface portproxy show all
```

### 6. Check Windows Firewall

```powershell
# Check if rule exists
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*3000*"}

# If not, add rule
New-NetFirewallRule -DisplayName "WSL2 Node.js Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 7. Find Your Windows Wi-Fi IP

```powershell
ipconfig | findstr IPv4
```

Look for your Wi-Fi adapter (usually `192.168.x.x`).

### 8. Test from Windows Browser First

Before trying mobile, test from Windows browser:
```
http://YOUR_WINDOWS_IP:3000
```

If this doesn't work, the port forwarding isn't set up correctly.

## Alternative: Use Windows Host IP Directly

If port forwarding is problematic, try binding directly to Windows host:

1. Get Windows host IP from WSL2:
```bash
cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
```

2. In WSL2, start server with specific host:
```bash
HOSTNAME=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}') npm run dev:network
```

Actually, this won't work because Next.js doesn't support binding to a different IP. 

## Best Alternative: Use ngrok

This is the most reliable solution:

1. Download ngrok: https://ngrok.com/download
2. Extract and add to PATH, or use from download folder
3. In WSL2:
   ```bash
   npm run dev:network
   ```
4. In Windows PowerShell (or another WSL terminal):
   ```bash
   ngrok http 3000
   ```
5. Use the ngrok URL (e.g., `https://abc123.ngrok-free.app`) on your mobile

## Quick Test Script

Create a test to verify connectivity:

In WSL2:
```bash
# Check if port 3000 is listening
netstat -tuln | grep 3000

# Should show something like:
# tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN
```

If it shows `127.0.0.1:3000` instead of `0.0.0.0:3000`, the server isn't binding correctly.
