# Fix Shopify App Authentication

## Problem
The app is generating `shopifyCreated: false` because it can't authenticate with Shopify to create real discount codes.

## Solution Steps

### 1. Check App Scopes
Ensure your app has these scopes in `shopify.app.toml`:
```toml
scopes = "write_discounts,write_price_rules,read_products"
```

### 2. Reinstall App
1. Uninstall the app from Shopify admin
2. Run: `npm run dev`
3. Reinstall the app with new scopes

### 3. Verify Installation
Check if session exists in database:
```sql
SELECT * FROM Session WHERE shop = 'your-shop.myshopify.com';
```

### 4. Test API Access
The app should be able to:
- Read shop information
- Create price rules
- Create discount codes

## Quick Test
After reinstalling, check server logs when generating discount codes. You should see:
```
Found 1 sessions for shop: your-shop.myshopify.com
Using session for shop: your-shop.myshopify.com, has access token: true
Successfully created discount code: ABC123
```

Instead of:
```
Found 0 sessions for shop: your-shop.myshopify.com
No valid session found for shop: your-shop.myshopify.com