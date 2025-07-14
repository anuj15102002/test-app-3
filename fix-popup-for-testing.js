// Fix popup configuration for testing
// Run this with: node fix-popup-for-testing.js

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function fixPopupForTesting() {
  console.log('🔧 Fixing popup configuration for testing...\n');
  
  try {
    // Update the popup configuration to make it easier to test
    const updatedConfig = await db.popupConfig.updateMany({
      where: {
        shop: 'appdevelopmentst.myshopify.com',
        isActive: true
      },
      data: {
        frequency: 'always',  // Show on every visit for testing
        displayDelay: 2000,   // 2 second delay (easier to see)
        exitIntent: false,    // Disable exit intent for testing
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Updated', updatedConfig.count, 'popup configuration(s)');
    
    // Verify the update
    const config = await db.popupConfig.findFirst({
      where: {
        shop: 'appdevelopmentst.myshopify.com',
        isActive: true
      }
    });
    
    if (config) {
      console.log('\n📋 Updated Configuration:');
      console.log('Shop:', config.shop);
      console.log('Type:', config.type);
      console.log('Title:', config.title);
      console.log('Display Delay:', config.displayDelay + 'ms');
      console.log('Frequency:', config.frequency);
      console.log('Exit Intent:', config.exitIntent);
      console.log('Is Active:', config.isActive);
      
      console.log('\n🎉 Configuration updated successfully!');
      console.log('\n🌐 Now test your popup:');
      console.log('1. Open your store in a new browser tab/window');
      console.log('2. The popup should appear after 2 seconds');
      console.log('3. It will show on every page load now');
      console.log('4. Check browser console for any errors if it still doesn\'t show');
      
      console.log('\n💡 If popup still doesn\'t show, check:');
      console.log('- Is the app extension installed in your theme?');
      console.log('- Are there any JavaScript errors in browser console?');
      console.log('- Is the popup block added to your theme?');
    }
    
  } catch (error) {
    console.error('❌ Error fixing popup configuration:', error);
  } finally {
    await db.$disconnect();
  }
}

fixPopupForTesting();