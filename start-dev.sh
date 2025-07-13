#!/bin/bash

# Start ngrok with a fixed subdomain (requires ngrok account)
# Sign up at https://ngrok.com and get your authtoken
# Run: ngrok config add-authtoken YOUR_TOKEN

echo "Starting development server with fixed ngrok tunnel..."

# Start your app in background
npm run dev &
APP_PID=$!

# Wait for app to start
sleep 5

# Start ngrok with fixed subdomain (replace 'your-app-name' with your preferred subdomain)
ngrok http 38975 --subdomain=your-shopify-popup-app &
NGROK_PID=$!

echo "App running at: https://your-shopify-popup-app.ngrok.io"
echo "Update your Partner Dashboard App Proxy URL to: https://your-shopify-popup-app.ngrok.io/api/public"

# Wait for user to stop
read -p "Press Enter to stop servers..."

# Kill processes
kill $APP_PID $NGROK_PID