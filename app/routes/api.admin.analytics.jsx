import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const url = new URL(request.url);
    const timeRange = url.searchParams.get("timeRange") || "24h"; // 24h, 7d, 30d

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

    console.log(`Fetching analytics for shop: ${session.shop} from ${startDate.toISOString()}`);

    // Get all analytics events for the shop within the time range
    const events = await db.popupAnalytics.findMany({
      where: {
        shop: session.shop,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    // Calculate metrics
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

    // Get hourly data for charts (last 24 hours)
    const hourlyData = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const hourEvents = events.filter(e => 
        new Date(e.timestamp) >= hourStart && new Date(e.timestamp) < hourEnd
      );
      
      hourlyData.push({
        hour: hourStart.getHours(),
        views: hourEvents.filter(e => e.eventType === 'view').length,
        emails: hourEvents.filter(e => e.eventType === 'email_entered').length,
        wins: hourEvents.filter(e => e.eventType === 'win').length,
        timestamp: hourStart.toISOString()
      });
    }

    // Get recent events for activity feed
    const recentEvents = events.slice(0, 10).map(event => ({
      id: event.id,
      eventType: event.eventType,
      email: event.email,
      discountCode: event.discountCode,
      prizeLabel: event.prizeLabel,
      timestamp: event.timestamp,
      timeAgo: getTimeAgo(new Date(event.timestamp))
    }));

    // Get prize distribution
    const prizeDistribution = {};
    events.filter(e => e.eventType === 'win' && e.prizeLabel).forEach(event => {
      prizeDistribution[event.prizeLabel] = (prizeDistribution[event.prizeLabel] || 0) + 1;
    });

    // Get top performing hours
    const hourlyPerformance = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { views: 0, conversions: 0 };
      }
      if (event.eventType === 'view') hourlyPerformance[hour].views++;
      if (event.eventType === 'win') hourlyPerformance[hour].conversions++;
    });

    const analytics = {
      summary: {
        totalViews,
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
      hourlyData,
      recentEvents,
      prizeDistribution,
      hourlyPerformance,
      timeRange,
      lastUpdated: new Date().toISOString()
    };

    return json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return json({
      success: false,
      error: "Failed to fetch analytics data"
    }, {
      status: 500
    });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}