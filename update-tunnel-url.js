#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function getCurrentTunnelUrl() {
  try {
    // Try to get Cloudflare tunnel URL from logs or process
    const result = execSync('ps aux | grep cloudflared | grep -v grep', { encoding: 'utf8' });
    
    // Extract URL from cloudflared process (this is a simplified approach)
    const urlMatch = result.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    
    if (urlMatch) {
      return urlMatch[0];
    }
    
    // Fallback: try to read from a temp file if you save it there
    if (fs.existsSync('.tunnel-url')) {
      return fs.readFileSync('.tunnel-url', 'utf8').trim();
    }
    
    throw new Error('Could not detect tunnel URL');
  } catch (error) {
    console.error('Error getting tunnel URL:', error.message);
    console.log('Please manually set TUNNEL_URL environment variable');
    return process.env.TUNNEL_URL || null;
  }
}

async function updateShopifyConfig() {
  const tunnelUrl = await getCurrentTunnelUrl();
  
  if (!tunnelUrl) {
    console.error('No tunnel URL found. Please start your tunnel first.');
    process.exit(1);
  }
  
  console.log('Current tunnel URL:', tunnelUrl);
  
  // Read shopify.app.toml
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
  
  // Write back to file
  fs.writeFileSync(configPath, config);
  
  console.log('✅ Updated shopify.app.toml with new tunnel URL');
  console.log('🔄 Restart your Shopify CLI if it\'s running');
}

// Run if called directly
if (require.main === module) {
  updateShopifyConfig().catch(console.error);
}

module.exports = { updateShopifyConfig, getCurrentTunnelUrl };