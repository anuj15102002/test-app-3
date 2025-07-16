import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSubscribersAPI() {
  try {
    const shop = 'appdevelopmentst.myshopify.com';
    const search = '';
    
    console.log('🔍 Testing subscribers API logic...');
    console.log(`Shop: ${shop}`);
    
    // Step 1: Get popup email entries
    console.log('\n📧 Step 1: Getting popup email entries...');
    const popupEmailEntries = await prisma.popupAnalytics.findMany({
      where: {
        shop: shop,
        eventType: 'email_entered',
        email: {
          not: null,
          contains: search
        }
      },
      select: {
        email: true,
        timestamp: true,
        discountCode: true,
        prizeLabel: true,
        userAgent: true,
        ipAddress: true,
        sessionId: true,
        metadata: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    console.log(`Found ${popupEmailEntries.length} popup email entries:`);
    popupEmailEntries.forEach((entry, index) => {
      console.log(`${index + 1}. Email: ${entry.email}, Time: ${entry.timestamp}`);
    });
    
    // Step 2: Get email addresses
    const emailAddresses = [...new Set(popupEmailEntries.map(entry => entry.email))];
    console.log(`\n📋 Unique email addresses: ${emailAddresses.join(', ')}`);
    
    // Step 3: Get all popup analytics for these emails
    console.log('\n📊 Step 3: Getting all popup analytics...');
    const allPopupAnalytics = await prisma.popupAnalytics.findMany({
      where: {
        shop: shop,
        email: {
          in: emailAddresses
        }
      },
      select: {
        email: true,
        eventType: true,
        timestamp: true,
        discountCode: true,
        prizeLabel: true,
        userAgent: true,
        ipAddress: true,
        sessionId: true,
        metadata: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    });
    
    console.log(`Found ${allPopupAnalytics.length} total analytics records for these emails`);
    
    // Step 4: Get discount codes
    console.log('\n💰 Step 4: Getting discount codes...');
    const discountCodes = await prisma.discountCode.findMany({
      where: {
        shop: shop,
        email: {
          in: emailAddresses
        }
      },
      select: {
        email: true,
        createdAt: true,
        code: true,
        discountType: true,
        discountValue: true,
        usageCount: true,
        isActive: true,
        endsAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${discountCodes.length} discount codes for these emails`);
    
    // Step 5: Process data like the API does
    console.log('\n🔄 Step 5: Processing subscriber data...');
    const subscriberMap = new Map();

    // Process popup email entries first
    popupEmailEntries.forEach(entry => {
      if (!subscriberMap.has(entry.email)) {
        subscriberMap.set(entry.email, {
          email: entry.email,
          firstEmailEntry: entry.timestamp,
          lastActivity: entry.timestamp,
          source: 'popup',
          popupInteractions: {
            totalInteractions: 0,
            emailEntries: 0,
            views: 0,
            spins: 0,
            wins: 0,
            losses: 0,
            codesCopied: 0,
            closes: 0
          },
          discountCodes: [],
          totalDiscounts: 0,
          activeDiscounts: 0,
          userAgent: entry.userAgent,
          lastSessionId: entry.sessionId,
          prizesWon: [],
          interactionHistory: []
        });
      }
      
      const subscriber = subscriberMap.get(entry.email);
      subscriber.popupInteractions.emailEntries++;
      subscriber.interactionHistory.push({
        type: 'email_entered',
        timestamp: entry.timestamp,
        discountCode: entry.discountCode,
        prizeLabel: entry.prizeLabel,
        sessionId: entry.sessionId
      });
      
      if (entry.prizeLabel) {
        subscriber.prizesWon.push({
          prize: entry.prizeLabel,
          code: entry.discountCode,
          timestamp: entry.timestamp
        });
      }
    });

    // Process all popup analytics
    allPopupAnalytics.forEach(analytics => {
      const subscriber = subscriberMap.get(analytics.email);
      if (subscriber) {
        subscriber.popupInteractions.totalInteractions++;
        
        // Count different types of interactions
        switch (analytics.eventType) {
          case 'view':
            subscriber.popupInteractions.views++;
            break;
          case 'email_entered':
            // Already counted above
            break;
          case 'spin':
            subscriber.popupInteractions.spins++;
            break;
          case 'win':
            subscriber.popupInteractions.wins++;
            break;
          case 'lose':
            subscriber.popupInteractions.losses++;
            break;
          case 'copy_code':
            subscriber.popupInteractions.codesCopied++;
            break;
          case 'close':
            subscriber.popupInteractions.closes++;
            break;
        }
        
        // Update last activity
        if (analytics.timestamp > subscriber.lastActivity) {
          subscriber.lastActivity = analytics.timestamp;
          subscriber.lastSessionId = analytics.sessionId;
        }
        
        // Add to interaction history if not already added
        if (analytics.eventType !== 'email_entered') {
          subscriber.interactionHistory.push({
            type: analytics.eventType,
            timestamp: analytics.timestamp,
            discountCode: analytics.discountCode,
            prizeLabel: analytics.prizeLabel,
            sessionId: analytics.sessionId
          });
        }
      }
    });

    // Process discount codes
    discountCodes.forEach(discount => {
      const subscriber = subscriberMap.get(discount.email);
      if (subscriber) {
        subscriber.discountCodes.push({
          code: discount.code,
          type: discount.discountType,
          value: discount.discountValue,
          usageCount: discount.usageCount,
          isActive: discount.isActive,
          createdAt: discount.createdAt,
          endsAt: discount.endsAt
        });
        subscriber.totalDiscounts++;
        if (discount.isActive) subscriber.activeDiscounts++;
      }
    });

    // Sort interaction history by timestamp
    subscriberMap.forEach(subscriber => {
      subscriber.interactionHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      subscriber.prizesWon.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    // Convert to array
    const subscribers = Array.from(subscriberMap.values());
    
    console.log(`\n✅ Final result: ${subscribers.length} subscribers processed`);
    
    if (subscribers.length > 0) {
      console.log('\n📋 Subscriber details:');
      subscribers.forEach((subscriber, index) => {
        console.log(`${index + 1}. Email: ${subscriber.email}`);
        console.log(`   First Email Entry: ${subscriber.firstEmailEntry}`);
        console.log(`   Last Activity: ${subscriber.lastActivity}`);
        console.log(`   Total Interactions: ${subscriber.popupInteractions.totalInteractions}`);
        console.log(`   Email Entries: ${subscriber.popupInteractions.emailEntries}`);
        console.log(`   Views: ${subscriber.popupInteractions.views}`);
        console.log(`   Spins: ${subscriber.popupInteractions.spins}`);
        console.log(`   Wins: ${subscriber.popupInteractions.wins}`);
        console.log(`   Losses: ${subscriber.popupInteractions.losses}`);
        console.log(`   Closes: ${subscriber.popupInteractions.closes}`);
        console.log(`   Total Discounts: ${subscriber.totalDiscounts}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing subscribers API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSubscribersAPI();