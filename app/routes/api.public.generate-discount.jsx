import { json } from "@remix-run/node";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export const action = async ({ request }) => {
  try {
    // Get shop from query params or form data
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

    const discountType = formData.get("discountType") || "percentage";
    const discountValue = formData.get("discountValue") || "10";
    const email = formData.get("email");

    if (!email) {
      return json({ error: "Email is required" }, {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log(`Creating discount for email: ${email} on shop: ${shop}`);

    // Try to create real Shopify discount code via admin API
    try {
      // Get the app URL from environment or construct it
      const appUrl = process.env.SHOPIFY_APP_URL || 'https://considerations-fits-steel-meal.trycloudflare.com';
      
      // Call the admin API to create the discount
      const adminFormData = new FormData();
      adminFormData.append('discountType', discountType);
      adminFormData.append('discountValue', discountValue);
      adminFormData.append('email', email);
      
      const adminResponse = await fetch(`${appUrl}/api/admin/create-discount`, {
        method: 'POST',
        body: adminFormData,
        headers: {
          'X-Shopify-Shop-Domain': shop,
        },
      });

      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        console.log('Successfully created Shopify discount via admin API:', adminData.discountCode);
        
        return json({
          success: true,
          discountCode: adminData.discountCode,
          discountType: adminData.discountType,
          discountValue: adminData.discountValue,
          expiresAt: adminData.expiresAt,
          shopifyCreated: true,
        }, {
          headers: corsHeaders
        });
      } else {
        const errorText = await adminResponse.text();
        console.error('Admin API failed:', errorText);
        throw new Error(`Admin API failed: ${adminResponse.status}`);
      }

    } catch (adminError) {
      console.error("Admin API Error:", adminError);
      
      // Generate simple 6-character fallback code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let fallbackCode = '';
      for (let i = 0; i < 6; i++) {
        fallbackCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Fallback: Return simple discount code
      return json({
        success: true,
        discountCode: fallbackCode,
        discountType: discountType,
        discountValue: discountValue,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        shopifyCreated: false,
      }, {
        headers: corsHeaders
      });
    }

  } catch (error) {
    console.error("Error generating discount code:", error);
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