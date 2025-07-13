# Development Setup - No More Manual URL Updates!

## Problem Solved ✅

Your popup wasn't getting the app URL because the Cloudflare tunnel URL changes every restart. This has been fixed with multiple solutions.

## Solutions Available

### Option 1: Automatic Tunnel Management (Recommended)

Use the automated development script that handles everything:

```bash
npm run dev:tunnel
```

This script will:
- ✅ Start Cloudflare tunnel automatically
- ✅ Detect the new tunnel URL
- ✅ Update `shopify.app.toml` automatically
- ✅ Start your Shopify app
- ✅ No manual intervention needed!

### Option 2: Manual Tunnel Update

If you prefer to manage the tunnel yourself:

```bash
# Start your tunnel first
cloudflared tunnel --url http://localhost:38975

# In another terminal, update config with detected URL
npm run update-tunnel

# Then start your app
npm run dev
```

### Option 3: Fixed Subdomain with ngrok

For a completely stable URL:

```bash
# Sign up at ngrok.com and get your authtoken
ngrok config add-authtoken YOUR_TOKEN

# Use the provided script
./start-dev.sh
```

## How It Works

1. **Your popup extension** ([`popup_display.liquid`](extensions/pop-up/blocks/popup_display.liquid)) now reads the app URL from a meta tag
2. **Your app** ([`app/root.jsx`](app/root.jsx)) automatically sets this meta tag with the current URL
3. **No App Proxy needed** - direct CORS requests work perfectly
4. **Automatic updates** - scripts handle URL changes for you

## Current Configuration

- ✅ Popup code updated to use dynamic URLs
- ✅ Environment configuration handles both dev and production
- ✅ CORS properly configured in API routes
- ✅ Meta tag system for URL detection

## Usage

### For Development
```bash
npm run dev:tunnel  # Fully automated
```

### For Production
Your popup will automatically work in production Shopify stores without any changes needed.

## Files Created/Modified

- [`dev-with-tunnel.js`](dev-with-tunnel.js) - Automated development script
- [`update-tunnel-url.js`](update-tunnel-url.js) - Manual URL update utility
- [`start-dev.sh`](start-dev.sh) - ngrok alternative script
- [`extensions/pop-up/blocks/popup_display.liquid`](extensions/pop-up/blocks/popup_display.liquid) - Updated popup code
- [`app/config/environment.js`](app/config/environment.js) - Environment utilities
- [`package.json`](package.json) - Added new scripts

## No More Manual Work!

You no longer need to:
- ❌ Manually update Partner Dashboard App Proxy
- ❌ Copy/paste tunnel URLs
- ❌ Restart processes when URLs change
- ❌ Remember to update configuration files

Just run `npm run dev:tunnel` and everything works automatically! 🎉