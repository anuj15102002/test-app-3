import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || "";
    const sortBy = url.searchParams.get("sortBy") || "timestamp";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Focus on popup email entries - get all popup analytics data for users who entered emails
    const popupEmailEntries = await prisma.popupAnalytics.findMany({
      where: {
        shop: session.shop,
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

    // Get all popup analytics for these email addresses to show complete interaction history
    const emailAddresses = [...new Set(popupEmailEntries.map(entry => entry.email))];
    
    const allPopupAnalytics = await prisma.popupAnalytics.findMany({
      where: {
        shop: session.shop,
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

    // Get discount codes for these email addresses
    const discountCodes = await prisma.discountCode.findMany({
      where: {
        shop: session.shop,
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

    // Create subscriber profiles focused on popup email entries
    const subscriberMap = new Map();

    // Process popup email entries first (primary focus)
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

    // Process all popup analytics to get complete interaction history
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

    // Convert to array and sort
    let subscribers = Array.from(subscriberMap.values());

    // Apply sorting
    subscribers.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'firstEmailEntry':
          aValue = new Date(a.firstEmailEntry);
          bValue = new Date(b.firstEmailEntry);
          break;
        case 'lastActivity':
          aValue = new Date(a.lastActivity);
          bValue = new Date(b.lastActivity);
          break;
        case 'totalDiscounts':
          aValue = a.totalDiscounts;
          bValue = b.totalDiscounts;
          break;
        case 'totalInteractions':
          aValue = a.popupInteractions.totalInteractions;
          bValue = b.popupInteractions.totalInteractions;
          break;
        case 'wins':
          aValue = a.popupInteractions.wins;
          bValue = b.popupInteractions.wins;
          break;
        case 'timestamp':
        default:
          aValue = new Date(a.lastActivity);
          bValue = new Date(b.lastActivity);
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const total = subscribers.length;
    const paginatedSubscribers = subscribers.slice(offset, offset + limit);

    // Calculate summary statistics
    const totalSubscribers = subscribers.length;
    const totalDiscountCodes = subscribers.reduce((sum, sub) => sum + sub.totalDiscounts, 0);
    const totalPopupInteractions = subscribers.reduce((sum, sub) => sum + sub.popupInteractions.totalInteractions, 0);
    const totalEmailEntries = subscribers.reduce((sum, sub) => sum + sub.popupInteractions.emailEntries, 0);
    const totalWins = subscribers.reduce((sum, sub) => sum + sub.popupInteractions.wins, 0);
    const totalSpins = subscribers.reduce((sum, sub) => sum + sub.popupInteractions.spins, 0);
    const activeSubscribers = subscribers.filter(sub => {
      const daysSinceLastActivity = (new Date() - new Date(sub.lastActivity)) / (1000 * 60 * 60 * 24);
      return daysSinceLastActivity <= 30;
    }).length;

    return json({
      success: true,
      subscribers: paginatedSubscribers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1
      },
      summary: {
        totalSubscribers,
        totalDiscountCodes,
        totalPopupInteractions,
        totalEmailEntries,
        totalWins,
        totalSpins,
        activeSubscribers
      }
    });

  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return json({ 
      error: "Failed to fetch subscribers",
      details: error.message 
    }, { 
      status: 500 
    });
  }
};