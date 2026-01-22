# Quick Start: Ngrok for Mobile Testing

## 🚀 Fast Setup (2 minutes)

### 1. Sign Up (30 seconds)
- Go to: https://dashboard.ngrok.com/signup
- Sign up with your email (free account)

### 2. Get Token (30 seconds)
- After signup, go to: https://dashboard.ngrok.com/get-started/your-authtoken
- Copy your authtoken

### 3. Configure (30 seconds)
Run this in your terminal:
```bash
cd /home/krinekk/dev/QuiziAI
./ngrok-auth-setup.sh
```
Paste your authtoken when prompted.

### 4. Start Testing (30 seconds)

**Terminal 1:**
```bash
cd /home/krinekk/dev/QuiziAI
npm run dev:network
```

**Terminal 2:**
```bash
export PATH="$HOME/.local/bin:$PATH"
ngrok http 3000
```

### 5. Use on Mobile
Copy the `https://xxxx.ngrok-free.app` URL from ngrok output and open it on your mobile browser!

---

## ✅ That's it!

The ngrok URL works from anywhere - your phone doesn't need to be on the same Wi-Fi.

**Note:** The URL changes each time you restart ngrok (unless you have a paid plan with a static domain).
