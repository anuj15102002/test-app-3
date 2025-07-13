// Environment configuration for the popup app
export const getAppUrl = () => {
  // Server-side: use environment variable (dynamic tunnel URL)
  if (typeof window === 'undefined') {
    return process.env.SHOPIFY_APP_URL || 'http://localhost:38975';
  }
  
  // Client-side: try to get from meta tag first
  const metaUrl = document.querySelector('meta[name="shopify-app-url"]')?.content;
  if (metaUrl) return metaUrl;
  
  // For development, use the current origin if it looks like a dev server
  if (window.location.hostname === 'localhost' ||
      window.location.hostname.includes('ngrok') ||
      window.location.hostname.includes('trycloudflare')) {
    return window.location.origin;
  }
  
  // Fallback for production
  return process.env.SHOPIFY_APP_URL || 'http://localhost:38975';
};

export const getApiEndpoints = (shopDomain) => {
  const isDevelopment = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
     window.location.hostname.includes('ngrok') ||
     window.location.hostname.includes('trycloudflare'));
  
  if (isDevelopment) {
    const appUrl = getAppUrl();
    return [
      `${appUrl}/api/public/popup-config?shop=${shopDomain}`,
      `/api/public/popup-config?shop=${shopDomain}`,
    ];
  } else {
    // Production: use App Proxy URL (stable across restarts)
    return [
      `/apps/popup-api/popup-config?shop=${shopDomain}`,
    ];
  }
};