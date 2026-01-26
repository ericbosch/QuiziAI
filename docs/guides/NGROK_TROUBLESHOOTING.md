# Ngrok Troubleshooting - Missing Content

## What You Should See

When accessing via ngrok, you should see:
1. ✅ **Title**: "QuiziAI 🧠" (large, centered)
2. ✅ **Input field**: "Tema de trivia" with placeholder text
3. ✅ **Button**: "Comenzar" (blue button)
4. ✅ **Footer**: "Powered by Wikipedia"

## Common Issues

### Issue 1: CSS Not Loading (Page looks unstyled)

**Symptoms:**
- Text is there but no colors/styling
- Layout looks broken
- No dark theme

**Solution:**
1. Check browser console (F12) for errors
2. Look for 404 errors on `/_next/static/` files
3. Make sure dev server is running: `npm run dev:network`
4. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue 2: JavaScript Not Working (Can't interact)

**Symptoms:**
- Can see the page but clicking does nothing
- Input field doesn't work
- Button doesn't respond

**Solution:**
1. Check browser console (F12) for JavaScript errors
2. Make sure you're using `npm run dev:network` (not just `npm run dev`)
3. Check that ngrok is forwarding to the correct port (3000)
4. Try accessing from a different browser

### Issue 3: Page Loads But Shows Blank/Incomplete

**Symptoms:**
- Only see partial content
- Some elements missing

**Solution:**
1. Check if dev server is fully started (wait for "Ready" message)
2. Check browser console for errors
3. Verify ngrok is showing "Forwarding" status
4. Try restarting both dev server and ngrok

## Quick Diagnostic Steps

1. **Check Dev Server:**
   ```bash
   # Should show:
   # - Local: http://localhost:3000
   # - Network: http://172.19.x.x:3000
   npm run dev:network
   ```

2. **Check Ngrok:**
   ```bash
   # Should show:
   # Forwarding https://xxxx.ngrok-free.app -> http://localhost:3000
   export PATH="$HOME/.local/bin:$PATH"
   ngrok http 3000
   ```

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for red errors
   - Check Network tab for failed requests

4. **Test Locally First:**
   - Try `http://localhost:3000` on your computer
   - If that works, the issue is with ngrok
   - If that doesn't work, the issue is with the app

## If Everything Looks Correct

If you see:
- ✅ Title "QuiziAI 🧠"
- ✅ Input field with "Tema de trivia"
- ✅ Blue "Comenzar" button
- ✅ Footer text

Then **everything is working correctly!** This is the initial screen. To test:

1. Type a topic (e.g., "Albert Einstein")
2. Click "Comenzar"
3. Wait for trivia to generate
4. You should see the game screen with questions

## Still Having Issues?

1. Share a screenshot of what you see
2. Check browser console for errors (F12 → Console tab)
3. Check the Network tab for failed requests
4. Verify both `npm run dev:network` and `ngrok http 3000` are running
