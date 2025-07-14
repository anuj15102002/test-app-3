// Debug script to help identify popup issues
// Run this with: node debug-popup-issue.js

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function debugPopupIssue() {
  console.log('🔍 Debugging Popup Issues...\n');
  
  try {
    // 1. Check if there are any popup configurations in the database
    const allConfigs = await db.popupConfig.findMany();
    console.log('📊 Total popup configurations in database:', allConfigs.length);
    
    if (allConfigs.length === 0) {
      console.log('❌ No popup configurations found in database!');
      console.log('💡 Solution: Save a popup configuration in the admin panel first.');
      return;
    }
    
    // 2. Check active configurations
    const activeConfigs = await db.popupConfig.findMany({
      where: { isActive: true }
    });
    console.log('✅ Active popup configurations:', activeConfigs.length);
    
    if (activeConfigs.length === 0) {
      console.log('❌ No active popup configurations found!');
      console.log('💡 Solution: Make sure your popup configuration is set to active.');
      return;
    }
    
    // 3. Display configuration details
    console.log('\n📋 Popup Configuration Details:');
    activeConfigs.forEach((config, index) => {
      console.log(`\n--- Configuration ${index + 1} ---`);
      console.log('Shop:', config.shop);
      console.log('Type:', config.type);
      console.log('Title:', config.title);
      console.log('Is Active:', config.isActive);
      console.log('Display Delay:', config.displayDelay + 'ms');
      console.log('Frequency:', config.frequency);
      console.log('Exit Intent:', config.exitIntent);
      console.log('Created:', config.createdAt);
      console.log('Updated:', config.updatedAt);
    });
    
    // 4. Check for common issues
    console.log('\n🔧 Common Issues Checklist:');
    
    const config = activeConfigs[0]; // Check first active config
    
    // Check display delay
    if (config.displayDelay > 10000) {
      console.log('⚠️  Display delay is very high (' + config.displayDelay + 'ms). Consider reducing it for testing.');
    } else {
      console.log('✅ Display delay looks reasonable (' + config.displayDelay + 'ms)');
    }
    
    // Check frequency setting
    if (config.frequency === 'once') {
      console.log('⚠️  Frequency is set to "once" - popup may not show if already displayed.');
      console.log('💡 Clear browser localStorage or set frequency to "always" for testing.');
    } else {
      console.log('✅ Frequency setting: ' + config.frequency);
    }
    
    // Check exit intent
    if (config.exitIntent) {
      console.log('⚠️  Exit intent is enabled - popup only shows when user tries to leave.');
      console.log('💡 Disable exit intent or move mouse to top of browser to trigger.');
    } else {
      console.log('✅ Exit intent is disabled - popup should show after delay.');
    }
    
    console.log('\n🌐 Next Steps to Test:');
    console.log('1. Open your store in an incognito/private browser window');
    console.log('2. Wait for the display delay (' + config.displayDelay + 'ms)');
    console.log('3. Check browser console for any JavaScript errors');
    console.log('4. Verify the app extension is installed and enabled in your theme');
    
    console.log('\n🛠️  Quick Fixes to Try:');
    console.log('1. Set frequency to "always" for testing');
    console.log('2. Reduce display delay to 1000ms (1 second)');
    console.log('3. Disable exit intent for testing');
    console.log('4. Clear browser localStorage: localStorage.clear()');
    
  } catch (error) {
    console.error('❌ Error debugging popup:', error);
  } finally {
    await db.$disconnect();
  }
}

debugPopupIssue();