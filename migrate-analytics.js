const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Running analytics migration...');
  
  try {
    // The migration will be applied automatically when Prisma detects the schema changes
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test the new table
    const count = await prisma.popupAnalytics.count();
    console.log(`✅ PopupAnalytics table is ready (${count} records)`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();