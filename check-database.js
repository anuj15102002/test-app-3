// Check what discount codes are in the database
// Run with: node check-database.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking discount codes in database...\n');
    
    const discountCodes = await prisma.discountCode.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Get last 10 codes
    });

    if (discountCodes.length === 0) {
      console.log('❌ No discount codes found in database');
      console.log('💡 This explains why the app admin shows no codes');
      console.log('🔧 The Shopify API is working, but database saves are failing');
    } else {
      console.log(`✅ Found ${discountCodes.length} discount codes in database:\n`);
      
      discountCodes.forEach((code, index) => {
        console.log(`${index + 1}. Code: ${code.code}`);
        console.log(`   Shop: ${code.shop}`);
        console.log(`   Email: ${code.email}`);
        console.log(`   Value: ${code.discountValue}${code.discountType === 'percentage' ? '%' : '$'} off`);
        console.log(`   Created: ${code.createdAt}`);
        console.log(`   Active: ${code.isActive}`);
        console.log('');
      });
    }

    // Check sessions too
    console.log('🔍 Checking sessions in database...\n');
    
    const sessions = await prisma.session.findMany({
      select: {
        shop: true,
        id: true,
        accessToken: true,
      },
      take: 5,
    });

    if (sessions.length === 0) {
      console.log('❌ No sessions found in database');
      console.log('💡 This would explain authentication issues');
    } else {
      console.log(`✅ Found ${sessions.length} sessions:\n`);
      sessions.forEach((session, index) => {
        console.log(`${index + 1}. Shop: ${session.shop}`);
        console.log(`   Has Access Token: ${!!session.accessToken}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();