/**
 * Utility functions for popup image management
 */

// Map popup types to their corresponding image files
export const POPUP_IMAGES = {
  "email": "emailPopup.png",
  "wheel-email": "wheelPopup.png", 
  "community": "communityPopup.png",
  "timer": "timerPopup.png",
  "scratch-card": "scratchPopup.png"
};

/**
 * Get the image path for a popup type
 * @param {string} popupType - The type of popup
 * @returns {string} The image path
 */
export function getPopupImagePath(popupType) {
  const imageName = POPUP_IMAGES[popupType] || POPUP_IMAGES["email"];
  return `/popup-images/${imageName}`;
}

/**
 * Get all popup types with their image paths
 * @returns {Array} Array of popup type objects with image paths
 */
export function getPopupTypesWithImages() {
  return [
    {
      type: "email",
      title: "Email Discount Popup",
      description: "Capture emails with discount offers to grow your subscriber list",
      image: getPopupImagePath("email"),
      color: "#007ace",
      features: ["Email capture", "Discount codes", "Customizable design", "Exit intent"],
    },
    {
      type: "wheel-email",
      title: "Wheel + Email Combo",
      description: "Interactive spinning wheel with email capture for higher engagement",
      image: getPopupImagePath("wheel-email"),
      color: "#1e40af",
      features: ["Spinning wheel", "Multiple prizes", "Email capture", "Gamification"]
    },
    {
      type: "community",
      title: "Community Social Popup",
      description: "Grow your social media following with attractive social icons",
      image: getPopupImagePath("community"),
      color: "#10b981",
      features: ["Social media links", "Custom banner", "Multiple platforms", "Ask me later"]
    },
    {
      type: "timer",
      title: "Timer Countdown Popup",
      description: "Create urgency with countdown timers for limited-time offers",
      image: getPopupImagePath("timer"),
      color: "#f59e0b",
      features: ["Countdown timer", "Urgency creation", "Email capture", "Custom expiry"]
    },
    {
      type: "scratch-card",
      title: "Scratch Card Popup",
      description: "Interactive scratch-to-win experience with discount reveals",
      image: getPopupImagePath("scratch-card"),
      color: "#8b5cf6",
      features: ["Canvas scratch effect", "Random discounts", "Email capture", "Gamification"]
    }
  ];
}