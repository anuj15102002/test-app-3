#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Analytics Dashboard...\n');

// Check if Prisma is available
try {
  execSync('npx prisma --version', { stdio: 'ignore' });
  console.log('✅ Prisma CLI found');
} catch (error) {
  console.error('❌ Prisma CLI not found. Please install it first:');
  console.error('   npm install prisma @prisma/client');
  process.exit(1);
}

// Check if migration file exists
const migrationPath = path.join(__dirname, 'prisma/migratgitions/20250712142000_add_popup_analytics/migration.sql');
if (fs.existsSync(migrationPath)) {
  console.log('✅ Analytics migration file found');
} else {
  console.error('❌ Analytics migration file not found');
  process.exit(1);
}

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  // Apply migrations
  console.log('🗄️  Applying database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Database migrations applied');

  // Test database connection
  console.log('🔌 Testing database connection...');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  await (async () => {
    try {
      await prisma.$connect();
      const count = await prisma.popupAnalytics.count();
      console.log(`✅ Database connected successfully (${count} analytics records)`);
      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
  })();

  console.log('\n🎉 Analytics Dashboard setup complete!');
  console.log('\nNext steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Navigate to the Analytics Dashboard in your app');
  console.log('3. Test popup interactions to see real-time data');
  console.log('\nFeatures available:');
  console.log('• Real-time event tracking');
  console.log('• Conversion rate analytics');
  console.log('• Hourly performance charts');
  console.log('• Live activity feed');
  console.log('• Prize distribution analysis');
  console.log('• Auto-refresh every 30 seconds');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}