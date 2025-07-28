/**
 * Social media icons utility
 * Provides access to social media icons for the admin interface
 */

// Import social media icons
import facebookIcon from './facebook.png';
import instagramIcon from './instagram.png';
import linkedinIcon from './linkedin.png';
import twitterIcon from './twitter.png';

/**
 * Get social media icon URL
 * @param {string} platform - Social media platform
 * @returns {string} Icon URL or null if not found
 */
export function getSocialIconUrl(platform) {
  const iconMap = {
    'facebook': facebookIcon,
    'instagram': instagramIcon,
    'linkedin': linkedinIcon,
    'twitter': twitterIcon,
    'x': twitterIcon // X uses the same icon as Twitter
  };

  return iconMap[platform] || null;
}

/**
 * Get all available social media icons
 * @returns {object} Object with platform names as keys and icon URLs as values
 */
export function getAllSocialIcons() {
  return {
    facebook: facebookIcon,
    instagram: instagramIcon,
    linkedin: linkedinIcon,
    twitter: twitterIcon,
    x: twitterIcon
  };
}