# Production Domain Setup Guide

Since you don't have a production domain yet, here's a comprehensive guide to set one up for your Shopify app.

## Why You Need a Production Domain

**Current Issue**: Your app uses a temporary Cloudflare tunnel (`derek-shakespeare-calendar-human.trycloudflare.com`) which:
- ❌ Will expire and break your app
- ❌ Is not suitable for production use
- ❌ Cannot be used for SSL certificates
- ❌ Not reliable for customer-facing applications

## Domain Options

### 1. **Free Options (Good for Testing)**
- **Heroku**: `your-app-name.herokuapp.com`
- **Vercel**: `your-app-name.vercel.app`
- **Netlify**: `your-app-name.netlify.app`
- **Railway**: `your-app-name.railway.app`

### 2. **Custom Domain (Recommended for Production)**
- Purchase from: Namecheap, GoDaddy, Google Domains, Cloudflare
- Cost: $10-15/year
- Examples: `yourappname.com`, `popup-app.com`

## Step-by-Step Setup

### Option A: Using Heroku (Free Tier Available)

1. **Create Heroku Account**
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   
   # Login to Heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   # Create new app
   heroku create your-popup-app-name
   
   # Your app will be available at:
   # https://your-popup-app-name.herokuapp.com
   ```

3. **Configure Environment Variables**
   ```bash
   heroku config:set SHOPIFY_API_KEY=your_api_key
   heroku config:set SHOPIFY_API_SECRET=your_api_secret
   heroku config:set DATABASE_URL=your_mysql_url
   heroku config:set SHOPIFY_APP_URL=https://your-popup-app-name.herokuapp.com
   ```

4. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push heroku main
   ```

### Option B: Using Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Go to Vercel dashboard
   - Add environment variables in project settings

### Option C: Custom Domain + Cloud Provider

1. **Buy Domain** (e.g., from Namecheap)
2. **Choose Cloud Provider**:
   - **DigitalOcean App Platform**
   - **AWS Elastic Beanstalk**
   - **Google Cloud Run**
   - **Azure App Service**

## Update Your App Configuration

Once you have your production domain, update these files:

### 1. Update `.env`
```env
SHOPIFY_APP_URL=https://your-production-domain.com
HOST=your-production-domain.com
```

### 2. Update `shopify.app.toml`
```toml
application_url = "https://your-production-domain.com"

[auth]
redirect_urls = [
  "https://your-production-domain.com/auth/callback",
  "https://your-production-domain.com/auth/shopify/callback",
  "https://your-production-domain.com/api/auth/callback"
]
```

### 3. Update Shopify Extension
In `extensions/pop-up/blocks/popup_display.liquid`:
```javascript
let applicationUrl = 'https://your-production-domain.com';
```

## SSL Certificate Setup

### Automatic SSL (Recommended)
Most platforms provide automatic SSL:
- ✅ Heroku: Automatic SSL
- ✅ Vercel: Automatic SSL
- ✅ Netlify: Automatic SSL

### Manual SSL Setup
If using custom server:
1. **Let's Encrypt** (Free): Use Certbot
2. **Cloudflare** (Free): Proxy through Cloudflare
3. **Paid SSL**: From your domain provider

## Environment-Specific Configuration

Create different configurations for different environments:

### Development
```env
SHOPIFY_APP_URL=https://your-tunnel-url.trycloudflare.com
NODE_ENV=development
```

### Production
```env
SHOPIFY_APP_URL=https://your-production-domain.com
NODE_ENV=production
```

## Recommended Quick Start: Heroku

For fastest setup, I recommend Heroku:

1. **Create Heroku account** (free)
2. **Deploy your app** to get `your-app.herokuapp.com`
3. **Update configurations** with the Heroku URL
4. **Test thoroughly** before going live
5. **Later**: Add custom domain if needed

## Cost Breakdown

### Free Options
- Heroku (with limitations): $0
- Vercel: $0
- Netlify: $0

### Paid Options
- Custom domain: $10-15/year
- Heroku Pro: $7/month
- DigitalOcean: $5/month
- AWS/GCP: Variable based on usage

## Next Steps

1. Choose a deployment platform
2. Set up your production domain
3. Update all configuration files
4. Deploy and test
5. Update Shopify app settings with new URLs

## Security Considerations

- ✅ Always use HTTPS in production
- ✅ Keep environment variables secure
- ✅ Use different API keys for production
- ✅ Enable proper CORS settings
- ✅ Set up monitoring and logging

Would you like me to help you set up any specific option?