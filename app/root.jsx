import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

export const loader = async ({ request }) => {
  // Get the app URL from environment or use the current request origin
  let appUrl = process.env.SHOPIFY_APP_URL || process.env.APPLICATION_URL;
  
  // If no environment variable is set, use the current request origin
  if (!appUrl) {
    const url = new URL(request.url);
    appUrl = `${url.protocol}//${url.host}`;
  }
  
  console.log('App URL being set in meta tag:', appUrl);
  
  return {
    shopifyAppUrl: appUrl,
  };
};

export default function App() {
  const { shopifyAppUrl } = useLoaderData();

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {shopifyAppUrl && <meta name="shopify-app-url" content={shopifyAppUrl} />}
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
