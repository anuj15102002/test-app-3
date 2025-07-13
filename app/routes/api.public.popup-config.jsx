import { json } from "@remix-run/node";
import db from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (!shop) {
    const errorResponse = { error: "Shop parameter is required" };
    return json(errorResponse, {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      }
    });
  }

  // Validate shop domain format
  const isValidShopFormat = shop.includes('.myshopify.com') || shop.includes('.shopify.com');
  
  if (!isValidShopFormat) {
    const errorResponse = { error: "Invalid shop domain format" };
    return json(errorResponse, {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      }
    });
  }
  
  try {
    const popupConfig = await db.popupConfig.findFirst({
      where: {
        shop: shop,
        isActive: true
      }
    });
    
    if (!popupConfig) {
      const nullResponse = { config: null };
      
      return json(nullResponse, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        }
      });
    }
    
    
    // Parse segments if it's a wheel type
    let parsedSegments = null;
    if (popupConfig.segments) {
      try {
        parsedSegments = JSON.parse(popupConfig.segments);
      } catch (parseError) {
        // Failed to parse segments JSON
      }
    }
    
    const config = {
      ...popupConfig,
      segments: parsedSegments
    };
    
    const finalResponse = { config };
    
    return json(finalResponse, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      }
    });
  } catch (error) {
    const errorResponse = { error: "Failed to fetch configuration" };
    
    return json(errorResponse, {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      }
    });
  }
};

// Handle preflight requests for CORS
export const options = () => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Allow-Credentials": "false",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    },
  });
};