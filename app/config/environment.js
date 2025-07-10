// Environment configuration for the popup app
export const getAppUrl = () => {
  // In production, use the configured app URL
  if (typeof window !== 'undefined') {
    // Client-side: try to get from meta tag first, then fallback to current origin
    const metaUrl = document.querySelector('meta[name="shopify-app-url"]')?.content;
    if (metaUrl) return metaUrl;
    
    // For development, use the current origin if it looks like a dev server
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('ngrok') || window.location.hostname.includes('trycloudflare')) {
      return window.location.origin;
    }
  }
  
  // Server-side or fallback
  return process.env.SHOPIFY_APP_URL || 'https://either-feeds-pending-consists.trycloudflare.com';
};

export const getApiEndpoints = (shopDomain) => {
  const appUrl = getAppUrl();
  
  return [
    `${appUrl}/api/public/popup-config?shop=${shopDomain}`,
    `${appUrl}/api/popup-config?shop=${shopDomain}`,
    `/api/public/popup-config?shop=${shopDomain}`,
    `/api/popup-config?shop=${shopDomain}`,
    `https://${shopDomain}/apps/api/public/popup-config?shop=${shopDomain}`
  ];
};