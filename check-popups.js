// Check what popup configurations are in the database
// Run with: node check-popups.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPopups() {
  try {
    console.log('🔍 Checking popup configurations in database...\n');
    
    const popups = await prisma.popupConfig.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (popups.length === 0) {
      console.log('❌ No popup configurations found in database');
      console.log('💡 This explains why popups are not being saved');
      console.log('🔧 The popup creation/save process is failing');
    } else {
      console.log(`✅ Found ${popups.length} popup configurations in database:\n`);
      
      popups.forEach((popup, index) => {
        console.log(`${index + 1}. Name: ${popup.name}`);
        console.log(`   Shop: ${popup.shop}`);
        console.log(`   Type: ${popup.type}`);
        console.log(`   Title: ${popup.title}`);
        console.log(`   Active: ${popup.isActive}`);
        console.log(`   Created: ${popup.createdAt}`);
        console.log(`   Updated: ${popup.updatedAt}`);
        console.log('');
      });
    }

