import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const popupId = url.searchParams.get("popupId");
    const timeRange = url.searchParams.get("timeRange") || "30d"; // 24h, 7d, 30d

    if (!popupId) {
      return json({ error: "Popup ID is required" }, { status: 400 });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "24h":
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
    }

    console.log(`Fetching popup analytics for popup: ${popupId}, shop: ${session.shop}`);

    // Get all analytics events for this specific popup
    const events = await prisma.popupAnalytics.findMany({
      where: {
        shop: session.shop,
        popupId: popupId,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Calculate metrics for this popup
    const totalViews = events.filter(e => e.eventType === 'view').length;
    const emailsEntered = events.filter(e => e.eventType === 'email_entered').length;
    const spins = events.filter(e => e.eventType === 'spin').length;
    const wins = events.filter(e => e.eventType === 'win').length;
    const loses = events.filter(e => e.eventType === 'lose').length;
    const closes = events.filter(e => e.eventType === 'close').length;
    const codesCopied = events.filter(e => e.eventType === 'copy_code').length;

    // Calculate conversion rates
    const emailConversionRate = totalViews > 0 ? ((emailsEntered / totalViews) * 100).toFixed(1) : 0;
    const spinConversionRate = emailsEntered > 0 ? ((spins / emailsEntered) * 100).toFixed(1) : 0;
    const winRate = spins > 0 ? ((wins / spins) * 100).toFixed(1) : 0;
    const copyRate = wins > 0 ? ((codesCopied / wins) * 100).toFixed(1) : 0;

    // Get unique subscribers (emails) for this popup
    const uniqueEmails = new Set();
    events.forEach(event => {
      if (event.email && event.eventType === 'email_entered') {
        uniqueEmails.add(event.email);
      }
    });
    const subscribers = uniqueEmails.size;

    const analytics = {
      popupId,
      summary: {
        totalViews,
        subscribers,
        emailsEntered,
        spins,
        wins,
        loses,
        closes,
        codesCopied,
        emailConversionRate: parseFloat(emailConversionRate),
        spinConversionRate: parseFloat(spinConversionRate),
        winRate: parseFloat(winRate),
        copyRate: parseFloat(copyRate)
      },
      timeRange,
      lastUpdated: new Date().toISOString()
    };

    return json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error("Error fetching popup analytics:", error);
    return json({
      success: false,
      error: "Failed to fetch popup analytics data"
    }, {
      status: 500
    });
  }
};