import { json } from "@remix-run/node";
import { getPopupConfig } from "../utils/db.server";

/**
 * App Proxy Integration Route
 * 
 * This route handles requests from the storefront via Shopify App Proxy.
 * It accepts a 'shop' query parameter and returns the popup configuration
 * for that shop in JSON format.
 * 
 * URL Pattern: /apps/popup?shop=example.myshopify.com
 */
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  // Validate shop parameter
  if (!shop) {
    return json(
      { error: "Shop parameter is required" },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        }
      }
    );
  }

  // Validate shop domain format
  const isValidShopFormat = shop.includes('.myshopify.com') || shop.includes('.shopify.com');
  
  if (!isValidShopFormat) {
    return json(
      { error: "Invalid shop domain format" },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        }
      }
    );
  }
  
  try {
    // Fetch popup configuration from database
    const popupConfig = await getPopupConfig(shop);
    
    if (!popupConfig) {
      return json(
        { popupConfig: null },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
          }
        }
      );
    }
    
    // Parse segments if it's a wheel type
    let parsedSegments = null;
    if (popupConfig.segments) {
      try {
        parsedSegments = JSON.parse(popupConfig.segments);
      } catch (parseError) {
        console.warn("Failed to parse popup segments:", parseError);
      }
    }
    
    const responseConfig = {
      ...popupConfig,
      segments: parsedSegments
    };
    
    return json(
      { popupConfig: responseConfig },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        }
      }
    );
  } catch (error) {
    console.error("Error fetching popup configuration:", error);
    
    return json(
      { error: "Failed to fetch popup configuration" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        }
      }
    );
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