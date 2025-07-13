import { json } from "@remix-run/node";
import db from "../db.server";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

// Hash IP address for privacy
function hashIP(ip) {
  if (!ip) return null;
  // Simple hash for privacy - in production, use a proper hashing library
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

export const action = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const shopFromQuery = url.searchParams.get('shop');
    const formData = await request.formData();
    const shopFromForm = formData.get("shop");
    const shop = shopFromQuery || shopFromForm;

    if (!shop) {
      return json({ error: "Shop parameter is required" }, {
        status: 400,
        headers: corsHeaders
      });
    }

    const eventType = formData.get("eventType");
    const email = formData.get("email");
    const discountCode = formData.get("discountCode");
    const prizeLabel = formData.get("prizeLabel");
    const sessionId = formData.get("sessionId");
    const metadata = formData.get("metadata");

    if (!eventType) {
      return json({ error: "Event type is required" }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get user info
    const userAgent = request.headers.get("user-agent");
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const clientIP = forwarded?.split(',')[0] || realIP || request.headers.get("cf-connecting-ip");
    const hashedIP = hashIP(clientIP);

    console.log(`Recording analytics event: ${eventType} for shop: ${shop}`);

    // Save analytics event to database
    await db.popupAnalytics.create({
      data: {
        shop: shop,
        eventType: eventType,
        email: email || null,
        discountCode: discountCode || null,
        prizeLabel: prizeLabel || null,
        userAgent: userAgent || null,
        ipAddress: hashedIP,
        sessionId: sessionId || null,
        metadata: metadata || null,
      }
    });

    return json({
      success: true,
      message: "Event recorded successfully"
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error("Error recording analytics event:", error);
    return json({ error: "Internal server error" }, {
      status: 500,
      headers: corsHeaders
    });
  }
};

// Handle OPTIONS preflight requests
export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }
  
  return json({ error: "Method not allowed" }, {
    status: 405,
    headers: corsHeaders
  });
};