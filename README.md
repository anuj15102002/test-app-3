# 🎯 Popup Customizer App

A comprehensive Shopify app for creating and customizing engaging popups to boost conversions. Choose between email capture popups and spinning wheel discount popups with full customization options.

## ✨ Features

### 🎨 Popup Types
- **Email Discount Popup**: Capture email addresses with discount offers
- **Spinning Wheel Popup**: Gamified discount experience with colorful wheel

### 🛠️ Customization Options
- **Content Customization**:
  - Custom titles and descriptions
  - Personalized button text
  - Email placeholder text
  - Discount codes

- **Visual Customization**:
  - Background colors
  - Text colors
  - Button colors
  - Border radius (email popup)
  - Display delay timing

- **Spinning Wheel Features**:
  - 6 customizable segments
  - Different discount percentages
  - Colorful visual design
  - Interactive spinning animation

### 📊 Analytics Dashboard
- Total popup views
- Conversion tracking
- Conversion rate analysis
- Performance breakdown by popup type
- Weekly trend analysis
- Actionable insights and recommendations

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.20+ or v20.10+ or v21.0.0+)
- Shopify CLI
- A Shopify development store

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd popup-customizer-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the app**
   - Follow the preview URL provided in the terminal
   - Complete Shopify authentication

## 📁 Project Structure

```
popup-customizer-app/
├── app/
│   ├── routes/
│   │   ├── app._index.jsx      # Main popup customizer interface
│   │   ├── app.additional.jsx  # Analytics dashboard
│   │   └── app.jsx            # App layout and navigation
│   ├── styles/
│   │   └── popup-customizer.css # Custom styles
│   └── shopify.server.js      # Shopify authentication
├── demo/
│   └── popup-demo.html        # Standalone demo (no auth required)
├── extensions/
│   └── pop-up/               # Shopify theme extension
└── prisma/
    └── schema.prisma         # Database schema
```

## 🎮 Demo

For a quick preview without Shopify authentication, open the standalone demo:

```bash
# Open in browser
open demo/popup-demo.html
```

The demo includes:
- ✅ Live popup type switching
- ✅ Real-time customization preview
- ✅ Color picker functionality
- ✅ Interactive spinning wheel
- ✅ Configuration export

## 🎨 UI Components

### Main Customizer Interface
- **Popup Type Selector**: Switch between email and spinning wheel
- **Configuration Panel**: All customization options
- **Live Preview**: Real-time popup preview
- **Statistics Cards**: Quick performance metrics
- **Tips Section**: Best practices and recommendations

### Analytics Dashboard
- **Performance Overview**: Key metrics with trend indicators
- **Popup Performance Table**: Detailed breakdown by popup type
- **Conversion Breakdown**: Visual progress indicators
- **Weekly Trends**: Day-by-day performance analysis
- **Insights & Recommendations**: AI-powered suggestions

## 🔧 Customization

### Email Popup Configuration
```javascript
{
  title: "Get 10% Off Your First Order!",
  description: "Subscribe to our newsletter and receive exclusive discounts",
  placeholder: "Enter your email address",
  buttonText: "Get Discount",
  discountCode: "WELCOME10",
  backgroundColor: "#ffffff",
  textColor: "#000000",
  buttonColor: "#007ace",
  borderRadius: 8,
  showCloseButton: true,
  displayDelay: 3000
}
```

### Spinning Wheel Configuration
```javascript
{
  title: "Spin to Win!",
  description: "Try your luck and win amazing discounts",
  buttonText: "Spin Now",
  segments: [
    { label: "5% Off", color: "#ff6b6b" },
    { label: "10% Off", color: "#4ecdc4" },
    { label: "15% Off", color: "#45b7d1" },
    { label: "20% Off", color: "#96ceb4" },
    { label: "Try Again", color: "#feca57" },
    { label: "Free Shipping", color: "#ff9ff3" }
  ],
  backgroundColor: "#ffffff",
  textColor: "#000000",
  displayDelay: 2000
}
```

## 📊 Analytics Features

### Key Metrics
- **Total Views**: Number of popup impressions
- **Conversions**: Successful email captures or wheel spins
- **Conversion Rate**: Percentage of views that convert
- **Average Time to Convert**: User engagement timing

### Performance Tracking
- Individual popup performance comparison
- A/B testing capabilities
- Trend analysis over time
- Actionable insights for optimization

## 🎯 Best Practices

### Email Popups
- Keep titles short and compelling
- Use clear value propositions
- Test different discount percentages
- Optimize display timing

### Spinning Wheels
- Balance winning and losing segments
- Use attractive color combinations
- Create excitement with animations
- Ensure mobile responsiveness

### General Tips
- Test different delay times
- Use contrasting colors for visibility
- Ensure discount codes are valid
- Monitor performance regularly

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run deploy` - Deploy to Shopify
- `npm run lint` - Run ESLint

### Tech Stack
- **Frontend**: React, Remix
- **UI Framework**: Shopify Polaris
- **Database**: Prisma with SQLite
- **Authentication**: Shopify App Bridge
- **Styling**: CSS Modules + Custom CSS

## 🚀 Deployment

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Deploy to Shopify**
   ```bash
   npm run deploy
   ```

3. **Configure app settings**
   - Set up webhooks
   - Configure app permissions
   - Test in production environment

## 📈 Performance Optimization

### Frontend Optimization
- Lazy loading for heavy components
- Optimized images and assets
- Efficient state management
- Responsive design patterns

### Backend Optimization
- Database query optimization
- Caching strategies
- API rate limiting
- Error handling

## 🔒 Security

- Shopify OAuth authentication
- CSRF protection
- Input validation and sanitization
- Secure API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the demo for examples
- Open an issue on GitHub
- Contact the development team

## 🎉 Acknowledgments

- Shopify for the excellent development platform
- Polaris design system for beautiful UI components
- The open-source community for inspiration and tools

---

**Happy popup customizing! 🎯✨**
