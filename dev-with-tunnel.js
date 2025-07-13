#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

let appProcess = null;
let tunnelProcess = null;

// Function to update shopify.app.toml with new URL
function updateShopifyConfig(tunnelUrl) {
  const configPath = path.join(__dirname, 'shopify.app.toml');
  let config = fs.readFileSync(configPath, 'utf8');
  
  // Update application_url
  config = config.replace(
    /application_url = ".*"/,
    `application_url = "${tunnelUrl}"`
  );
  
  // Update redirect_urls
  config = config.replace(
    /redirect_urls = \[.*\]/s,
    `redirect_urls = ["${tunnelUrl}/auth/callback", "${tunnelUrl}/auth/shopify/callback", "${tunnelUrl}/api/auth/callback"]`
  );
  
  fs.writeFileSync(configPath, config);
  console.log(`✅ Updated shopify.app.toml with: ${tunnelUrl}`);
}

// Function to start Cloudflare tunnel
function startTunnel() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting Cloudflare tunnel...');
    
    tunnelProcess = spawn('cloudflared', ['tunnel', '--url', 'http://localhost:38975'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let tunnelUrl = null;
    
    tunnelProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Tunnel:', output.trim());
      
      // Extract tunnel URL
      const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (urlMatch && !tunnelUrl) {
        tunnelUrl = urlMatch[0];
        console.log(`🌐 Tunnel URL: ${tunnelUrl}`);
        
        // Update shopify config
        updateShopifyConfig(tunnelUrl);
        
        // Save URL for later use
        fs.writeFileSync('.tunnel-url', tunnelUrl);
        
        resolve(tunnelUrl);
      }
    });
    
    tunnelProcess.stderr.on('data', (data) => {
      console.error('Tunnel error:', data.toString());
    });
    
    tunnelProcess.on('close', (code) => {
      console.log(`Tunnel process exited with code ${code}`);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!tunnelUrl) {
        reject(new Error('Tunnel URL not detected within 30 seconds'));
      }
    }, 30000);
  });
}

// Function to start the app
function startApp() {
  console.log('🚀 Starting Shopify app...');
  
  appProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  appProcess.on('close', (code) => {
    console.log(`App process exited with code ${code}`);
  });
}

// Main function
async function main() {
  try {
    // Start tunnel first
    const tunnelUrl = await startTunnel();
    
    // Wait a bit for tunnel to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start the app
    startApp();
    
    console.log('\n🎉 Development environment ready!');
    console.log(`📱 App URL: ${tunnelUrl}`);
    console.log('🔧 Your shopify.app.toml has been automatically updated');
    console.log('💡 No need to manually update Partner Dashboard - the URL is now stable!');
    console.log('\nPress Ctrl+C to stop both processes');
    
  } catch (error) {
    console.error('❌ Error starting development environment:', error.message);
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  
  if (appProcess) {
    appProcess.kill('SIGINT');
  }
  
  if (tunnelProcess) {
    tunnelProcess.kill('SIGINT');
  }
  
  // Clean up temp file
  if (fs.existsSync('.tunnel-url')) {
    fs.unlinkSync('.tunnel-url');
  }
  
  process.exit(0);
});

// Start everything
main();