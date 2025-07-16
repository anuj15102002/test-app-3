import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubscribers() {
  try {
    console.log('🔍 Checking PopupAnalytics table...');
    
    const allAnalytics = await prisma.popupAnalytics.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10
    });
    
    console.log(`📊 Found ${allAnalytics.length} popup analytics records`);
    
    if (allAnalytics.length > 0) {
      console.log('\n📋 Recent analytics records:');
      allAnalytics.forEach((record, index) => {
        console.log(`${index + 1}. Event: ${record.eventType}, Email: ${record.email || 'N/A'}, Time: ${record.timestamp}`);
      });
    }
    
    // Check specifically for email_entered events
    const emailEntries = await prisma.popupAnalytics.findMany({
      where: {
        eventType: 'email_entered',
        email: { not: null }
      },
      orderBy: { timestamp: 'desc' }
    });
    
    console.log(`\n📧 Found ${emailEntries.length} email entry records`);
    
    if (emailEntries.length > 0) {
      console.log('\n📋 Email entries:');
      emailEntries.forEach((record, index) => {
        console.log(`${index + 1}. Email: ${record.email}, Shop: ${record.shop}, Time: ${record.timestamp}`);
      });
    }
    
    // Check discount codes
    console.log('\n🔍 Checking DiscountCode table...');
    const discountCodes = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`💰 Found ${discountCodes.length} discount code records`);
    
    if (discountCodes.length > 0) {
      console.log('\n📋 Recent discount codes:');
      discountCodes.forEach((record, index) => {
        console.log(`${index + 1}. Email: ${record.email}, Code: ${record.code}, Shop: ${record.shop}`);
      });
    }
    
    // Check popup config
    console.log('\n🔍 Checking PopupConfig table...');
    const popupConfigs = await prisma.popupConfig.findMany();
    
    console.log(`⚙️ Found ${popupConfigs.length} popup config records`);
    
    if (popupConfigs.length > 0) {
      console.log('\n📋 Popup configs:');
      popupConfigs.forEach((config, index) => {
        console.log(`${index + 1}. Shop: ${config.shop}, Type: ${config.type}, Active: ${config.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking subscribers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscribers();