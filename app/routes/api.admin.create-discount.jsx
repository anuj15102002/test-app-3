import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Generate simple 6-character random code
function generateDiscountCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const discountType = formData.get("discountType") || "percentage";
    const discountValue = formData.get("discountValue") || "10";
    const email = formData.get("email");
    const shopDomain = request.headers.get("X-Shopify-Shop-Domain");

    if (!email) {
      return json({ error: "Email is required" }, { status: 400 });
    }

    if (!shopDomain) {
      return json({ error: "Shop domain is required" }, { status: 400 });
    }

    // Generate simple 6-character discount code
    const discountCode = generateDiscountCode();

    console.log(`Creating Shopify discount: ${discountCode} for ${email} on shop: ${shopDomain}`);

    // Try to get session for the shop from database
    let session = null;
    try {
      console.log(`Looking for sessions for shop: ${shopDomain}`);
      
      const sessions = await prisma.session.findMany({
        where: {
          shop: shopDomain,
        },
        orderBy: {
          id: 'desc',
        },
        take: 1,
      });
      
      console.log(`Found ${sessions.length} sessions for shop: ${shopDomain}`);
      
      if (sessions.length > 0) {
        session = sessions[0];
        console.log(`Using session for shop: ${session.shop}, has access token: ${!!session.accessToken}`);
      }
    } catch (sessionError) {
      console.error("Error finding session for shop:", shopDomain, sessionError);
    }

    if (!session || !session.accessToken) {
      console.error(`No valid session found for shop: ${shopDomain}`);
      // Instead of throwing error, return a fallback response
      const finalDiscountType = (discountType === "shipping" || discountValue === "100") ? "shipping" : discountType;
      const finalDiscountValue = (discountType === "shipping" || discountValue === "100") ? "100" : discountValue;
      
      return json({
        success: true,
        discountCode: discountCode,
        discountType: finalDiscountType,
        discountValue: finalDiscountValue,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        shopifyCreated: false,
        error: "No valid session found - app may need to be reinstalled"
      });
    }

    // Create discount using REST API (simpler and more reliable)
    let priceRuleData;
    
    if (discountType === "shipping" || discountValue === "100") {
      // Free shipping discount
      priceRuleData = {
        price_rule: {
          title: `Free Shipping ${discountCode}`,
          target_type: "shipping_line",
          target_selection: "all",
          allocation_method: "across",
          value_type: "percentage",
          value: "-100.0",
          customer_selection: "all",
          once_per_customer: true,
          usage_limit: 1,
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      };
    } else {
      // Regular percentage or fixed amount discount
      priceRuleData = {
        price_rule: {
          title: `Popup Discount ${discountCode}`,
          target_type: "line_item",
          target_selection: "all",
          allocation_method: "across",
          value_type: discountType === "percentage" ? "percentage" : "fixed_amount",
          value: discountType === "percentage" ? `-${discountValue}` : `-${discountValue}.00`,
          customer_selection: "all",
          once_per_customer: true,
          usage_limit: 1,
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      };
    }

    // Create price rule
    console.log(`Attempting to create price rule for shop: ${session.shop}`);
    console.log(`Access token exists: ${!!session.accessToken}`);
    
    const priceRuleResponse = await fetch(`https://${session.shop}/admin/api/2024-01/price_rules.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(priceRuleData),
    });
    
    console.log(`Price rule response status: ${priceRuleResponse.status}`);

    if (!priceRuleResponse.ok) {
      const errorText = await priceRuleResponse.text();
      console.error("Price rule creation failed:", priceRuleResponse.status, errorText);
      
      // Return fallback instead of throwing error
      const finalDiscountType = (discountType === "shipping" || discountValue === "100") ? "shipping" : discountType;
      const finalDiscountValue = (discountType === "shipping" || discountValue === "100") ? "100" : discountValue;
      
      return json({
        success: true,
        discountCode: discountCode,
        discountType: finalDiscountType,
        discountValue: finalDiscountValue,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        shopifyCreated: false,
        error: `Shopify API error: ${priceRuleResponse.status}`
      });
    }

    const priceRule = await priceRuleResponse.json();
    const priceRuleId = priceRule.price_rule.id;

    // Create discount code
    const discountCodeData = {
      discount_code: {
        code: discountCode,
        usage_count: 0,
      }
    };

    const discountCodeResponse = await fetch(`https://${session.shop}/admin/api/2024-01/price_rules/${priceRuleId}/discount_codes.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(discountCodeData),
    });

    if (!discountCodeResponse.ok) {
      const errorText = await discountCodeResponse.text();
      console.error("Discount code creation failed:", discountCodeResponse.status, errorText);
      
      // Return fallback instead of throwing error
      const finalDiscountType = (discountType === "shipping" || discountValue === "100") ? "shipping" : discountType;
      const finalDiscountValue = (discountType === "shipping" || discountValue === "100") ? "100" : discountValue;
      
      return json({
        success: true,
        discountCode: discountCode,
        discountType: finalDiscountType,
        discountValue: finalDiscountValue,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        shopifyCreated: false,
        error: `Discount code creation failed: ${discountCodeResponse.status}`
      });
    }

    const createdDiscountCode = await discountCodeResponse.json();
    const discountCodeId = createdDiscountCode.discount_code.id;

    console.log(`Successfully created discount code: ${discountCode}`);

    // Save to database for tracking
    try {
      const finalDiscountType = (discountType === "shipping" || discountValue === "100") ? "shipping" : discountType;
      const finalDiscountValue = (discountType === "shipping" || discountValue === "100") ? "100" : discountValue;
      
      await prisma.discountCode.create({
        data: {
          shop: session.shop,
          email: email,
          code: discountCode,
          discountType: finalDiscountType,
          discountValue: finalDiscountValue,
          priceRuleId: priceRuleId.toString(),
          discountCodeId: discountCodeId.toString(),
          isActive: true,
          usageCount: 0,
          usageLimit: 1,
          startsAt: new Date(priceRuleData.price_rule.starts_at),
          endsAt: new Date(priceRuleData.price_rule.ends_at),
        },
      });

      console.log(`Saved discount code to database: ${discountCode} (${finalDiscountType}: ${finalDiscountValue})`);
    } catch (dbError) {
      console.error("Database save error:", dbError);
      // Don't fail the request if database save fails, the Shopify discount is already created
    }

    const finalDiscountType = (discountType === "shipping" || discountValue === "100") ? "shipping" : discountType;
    const finalDiscountValue = (discountType === "shipping" || discountValue === "100") ? "100" : discountValue;

    return json({
      success: true,
      discountCode: discountCode,
      discountType: finalDiscountType,
      discountValue: finalDiscountValue,
      expiresAt: priceRuleData.price_rule.ends_at,
      shopifyCreated: true,
    });

  } catch (error) {
    console.error("Error creating discount code:", error);
    return json({
      error: "Failed to create discount code",
      details: error.message
    }, {
      status: 500
    });
  }
};