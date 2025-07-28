/**
 * Cloudinary CDN utility functions for popup logos and images
 */

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'your-cloud-name', // Replace with your Cloudinary cloud name
  baseUrl: 'https://res.cloudinary.com'
};

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  return CLOUDINARY_CONFIG.cloudName &&
         CLOUDINARY_CONFIG.cloudName !== 'your-cloud-name' &&
         CLOUDINARY_CONFIG.cloudName.trim() !== '';
};

/**
 * Generate Cloudinary URL for popup images
 * @param {string} publicId - The public ID of the image in Cloudinary
 * @param {object} options - Transformation options
 * @returns {string} Complete Cloudinary URL
 */
export function getCloudinaryUrl(publicId, options = {}) {
  const {
    width = 'auto',
    height = 'auto',
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    folder = 'popup-assets'
  } = options;

  const transformations = [
    `w_${width}`,
    `h_${height}`,
    `c_${crop}`,
    `q_${quality}`,
    `f_${format}`
  ].join(',');

  return `${CLOUDINARY_CONFIG.baseUrl}/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformations}/${folder}/${publicId}`;
}

/**
 * Get popup type image from Cloudinary
 * @param {string} popupType - The type of popup
 * @param {object} options - Image transformation options
 * @returns {string} Cloudinary URL for popup image
 */
export function getPopupImageFromCloudinary(popupType, options = {}) {
  // Return null if Cloudinary is not configured
  if (!isCloudinaryConfigured()) {
    return null;
  }

  const imageMap = {
    "email": "email-popup",
    "wheel-email": "wheel-popup",
    "community": "community-popup",
    "timer": "timer-popup",
    "scratch-card": "scratch-popup"
  };

  const publicId = imageMap[popupType] || imageMap["email"];
  
  return getCloudinaryUrl(publicId, {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
    ...options
  });
}

/**
 * Get social media icon from Cloudinary
 * @param {string} platform - Social media platform (facebook, instagram, linkedin, twitter)
 * @param {object} options - Image transformation options
 * @returns {string} Cloudinary URL for social media icon
 */
export function getSocialIconFromCloudinary(platform, options = {}) {
  // Return null if Cloudinary is not configured
  if (!isCloudinaryConfigured()) {
    return null;
  }

  const iconMap = {
    "facebook": "facebook-icon",
    "instagram": "instagram-icon",
    "linkedin": "linkedin-icon",
    "twitter": "twitter-icon",
    "x": "twitter-icon" // X (formerly Twitter) uses same icon
  };

  const publicId = iconMap[platform];
  if (!publicId) {
    console.warn(`Unknown social platform: ${platform}`);
    return null;
  }

  return getCloudinaryUrl(publicId, {
    width: 32,
    height: 32,
    crop: 'fill',
    quality: 'auto',
    format: 'png',
    folder: 'social-icons',
    ...options
  });
}

/**
 * Get optimized popup image for thumbnails
 * @param {string} popupType - The type of popup
 * @returns {string} Optimized Cloudinary URL for thumbnails
 */
export function getPopupThumbnailFromCloudinary(popupType) {
  // Return null if Cloudinary is not configured
  if (!isCloudinaryConfigured()) {
    return null;
  }

  return getPopupImageFromCloudinary(popupType, {
    width: 80,
    height: 80,
    crop: 'fill',
    quality: 'auto',
    format: 'webp'
  });
}