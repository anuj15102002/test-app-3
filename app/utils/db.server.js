import db from "../db.server.js";

/**
 * Database Utility Functions for Popup Management
 * 
 * This module provides utility functions for managing popup configurations
 * in the database. It includes functions to get and save popup configurations
 * for different shops.
 */

/**
 * Get popup configuration for a specific shop
 * @param {string} shop - The shop domain (e.g., "example.myshopify.com")
 * @returns {Promise<Object|null>} The popup configuration or null if not found
 */
export async function getPopupConfig(shop) {
  try {
    const popupConfig = await db.popupConfig.findFirst({
      where: {
        shop: shop,
        isActive: true
      }
    });
    
    return popupConfig;
  } catch (error) {
    console.error("Error fetching popup config:", error);
    throw new Error("Failed to fetch popup configuration");
  }
}

/**
 * Save popup configuration for a specific shop
 * @param {string} shop - The shop domain (e.g., "example.myshopify.com")
 * @param {Object} config - The popup configuration object
 * @param {string} config.type - Popup type ("email" or "wheel-email")
 * @param {string} config.title - Popup title
 * @param {string} config.description - Popup description
 * @param {string} [config.placeholder] - Email input placeholder
 * @param {string} config.buttonText - Button text
 * @param {string} [config.discountCode] - Discount code
 * @param {string} config.backgroundColor - Background color
 * @param {string} config.textColor - Text color
 * @param {string} [config.buttonColor] - Button color
 * @param {number} [config.borderRadius] - Border radius in pixels
 * @param {boolean} [config.showCloseButton] - Whether to show close button
 * @param {number} [config.displayDelay] - Display delay in milliseconds
 * @param {string} [config.frequency] - Display frequency ("once", "daily", "weekly", "always")
 * @param {boolean} [config.exitIntent] - Enable exit intent detection
 * @param {number} [config.exitIntentDelay] - Exit intent delay in milliseconds
 * @param {Array} [config.segments] - Wheel segments (for wheel-email type)
 * @param {string} [config.backgroundType] - Background type ("gradient", "solid", "custom")
 * @returns {Promise<Object>} The saved popup configuration
 */
export async function savePopupConfig(shop, config) {
  try {
    // Prepare the data for database insertion/update
    const popupData = {
      type: config.type,
      title: config.title,
      description: config.description,
      placeholder: config.placeholder || "",
      buttonText: config.buttonText,
      discountCode: config.discountCode || "",
      backgroundColor: config.backgroundColor,
      textColor: config.textColor,
      buttonColor: config.buttonColor || "#007ace",
      borderRadius: config.borderRadius || 8,
      showCloseButton: config.showCloseButton !== false,
      displayDelay: config.displayDelay || 3000,
      frequency: config.frequency || "once",
      exitIntent: config.exitIntent || false,
      exitIntentDelay: config.exitIntentDelay || 1000,
      segments: config.type === "wheel-email" && config.segments ? JSON.stringify(config.segments) : null,
      backgroundType: config.backgroundType || null,
      isActive: true,
      updatedAt: new Date()
    };

    // Use upsert to create or update the popup configuration
    const savedConfig = await db.popupConfig.upsert({
      where: { shop: shop },
      update: popupData,
      create: {
        shop: shop,
        ...popupData
      }
    });
    
    return savedConfig;
  } catch (error) {
    console.error("Error saving popup config:", error);
    throw new Error(`Failed to save popup configuration: ${error.message}`);
  }
}

/**
 * Get all popup configurations (for admin purposes)
 * @returns {Promise<Array>} Array of all popup configurations
 */
export async function getAllPopupConfigs() {
  try {
    const configs = await db.popupConfig.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    return configs;
  } catch (error) {
    console.error("Error fetching all popup configs:", error);
    throw new Error("Failed to fetch popup configurations");
  }
}

/**
 * Delete popup configuration for a specific shop
 * @param {string} shop - The shop domain
 * @returns {Promise<Object>} The deleted configuration
 */
export async function deletePopupConfig(shop) {
  try {
    const deletedConfig = await db.popupConfig.delete({
      where: { shop: shop }
    });
    
    return deletedConfig;
  } catch (error) {
    console.error("Error deleting popup config:", error);
    throw new Error("Failed to delete popup configuration");
  }
}

/**
 * Toggle popup active status for a specific shop
 * @param {string} shop - The shop domain
 * @param {boolean} isActive - Whether the popup should be active
 * @returns {Promise<Object>} The updated configuration
 */
export async function togglePopupStatus(shop, isActive) {
  try {
    const updatedConfig = await db.popupConfig.update({
      where: { shop: shop },
      data: {
        isActive: isActive,
        updatedAt: new Date()
      }
    });
    
    return updatedConfig;
  } catch (error) {
    console.error("Error toggling popup status:", error);
    throw new Error("Failed to toggle popup status");
  }
}