import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    
    // Get all discount codes for this shop
    const discountCodes = await prisma.discountCode.findMany({
      where: {
        shop: session.shop,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return json({
      success: true,
      discountCodes: discountCodes,
    });

  } catch (error) {
    console.error("Error fetching discount codes:", error);
    return json({ 
      error: "Failed to fetch discount codes",
      details: error.message 
    }, { 
      status: 500 
    });
  }
};

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const formData = await request.formData();
    const action = formData.get("action");
    const codeId = formData.get("codeId");

    if (action === "deactivate" && codeId) {
      // Deactivate a discount code
      await prisma.discountCode.update({
        where: {
          id: codeId,
          shop: session.shop,
        },
        data: {
          isActive: false,
        },
      });

      return json({
        success: true,
        message: "Discount code deactivated",
      });
    }

    if (action === "delete" && codeId) {
      // Delete a discount code from database (not from Shopify)
      await prisma.discountCode.delete({
        where: {
          id: codeId,
          shop: session.shop,
        },
      });

      return json({
        success: true,
        message: "Discount code deleted from database",
      });
    }

    return json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error managing discount code:", error);
    return json({ 
      error: "Failed to manage discount code",
      details: error.message 
    }, { 
      status: 500 
    });
  }
};