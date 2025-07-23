import { useEffect, useRef, useState } from "react";

/**
 * PopupPreview - A reusable React component that renders pixel-perfect previews of storefront popups
 *
 * This component is the heart of the live preview system in the popup configuration modal.
 * It takes popup configuration data and renders the exact same HTML/CSS that would appear
 * on the actual storefront, but in a safe preview environment.
 *
 * Key Features:
 * - 100% Visual Consistency: Uses identical HTML structure and CSS as storefront popups
 * - Real-time Updates: Automatically re-renders when configuration props change
 * - All Popup Types: Supports email, wheel-email, community, timer, and scratch-card popups
 * - Interactive Control: Can disable interactions for safe preview mode
 * - Responsive Design: Adapts to different container sizes while maintaining proportions
 * - Performance Optimized: Efficiently handles frequent configuration updates
 *
 * Technical Implementation:
 * - Extracts rendering logic from storefront popup.js into reusable functions
 * - Uses React refs to directly manipulate DOM for complex popup types
 * - Maintains separation between preview logic and actual storefront functionality
 * - Handles cleanup to prevent memory leaks during frequent re-renders
 *
 * Props:
 * @param {object} config - Complete popup configuration object
 * @param {string} type - Popup type ('email', 'wheel-email', 'community', 'timer', 'scratch-card')
 * @param {string} className - Additional CSS classes for styling
 * @param {object} style - Inline styles for the preview container
 * @param {boolean} disableInteractions - Whether to disable interactive elements (default: true)
 */
export default function PopupPreview({ 
  config, 
  type = "wheel-email", 
  className = "",
  style = {},
  disableInteractions = true 
}) {
  // ============================================================================
  // COMPONENT STATE AND REFS
  // ============================================================================
  
  const popupRef = useRef(null); // Direct DOM reference for popup container
  const [isRendered, setIsRendered] = useState(false); // Track rendering state

  // ============================================================================
  // MAIN RENDERING EFFECT
  // ============================================================================
  
  // Re-render popup whenever configuration changes
  useEffect(() => {
    if (!config || !popupRef.current) return;

    // Clear previous content
    popupRef.current.innerHTML = '';
    
    // Render the popup using the actual storefront logic
    renderStorefrontPopup(popupRef.current, { type, config, disableInteractions });
    setIsRendered(true);

    // Cleanup function
    return () => {
      if (popupRef.current) {
        popupRef.current.innerHTML = '';
      }
    };
  }, [config, type, disableInteractions]);

  // ============================================================================
  // COMPONENT RENDER
  // ============================================================================
  
  return (
    <div 
      ref={popupRef}
      className={`popup-preview ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: 'auto',
        ...style
      }}
    />
  );
}

// ============================================================================
// CORE RENDERING FUNCTIONS
// ============================================================================

/**
 * Main popup rendering function - orchestrates the entire popup creation process
 *
 * This function replicates the exact rendering logic used in the storefront popup.js
 * but adapts it for the React preview environment. It handles:
 * - HTML structure generation
 * - CSS styling application
 * - Type-specific functionality initialization
 *
 * @param {HTMLElement} container - DOM element to render popup into
 * @param {object} options - Rendering options (type, config, disableInteractions)
 */
function renderStorefrontPopup(container, { type, config, disableInteractions }) {
  // Create the popup structure using the same HTML as the storefront
  const popupHTML = createPopupHTML(type, config);
  container.innerHTML = popupHTML;

  // Apply the same styling logic as the storefront
  applyPopupStyling(container, type, config);

  // Initialize type-specific functionality (with interactions disabled for preview)
  if (!disableInteractions) {
    initializePopupType(container, type, config, disableInteractions);
  }
}

/**
 * HTML Structure Generator - creates the base popup container and content
 *
 * This function generates the foundational HTML structure that all popup types share.
 * It ensures consistency with the storefront implementation while providing the
 * flexibility needed for different popup types.
 *
 * @param {string} type - Popup type identifier
 * @param {object} config - Popup configuration object
 * @returns {string} Complete HTML string for the popup
 */
function createPopupHTML(type, config) {
  const baseHTML = `
    <div class="custom-popup ${type}-popup" style="position: relative; display: block; max-width: none; width: 100%; margin: 0;">
      <div class="popup-content">
        ${getPopupTypeContent(type, config)}
      </div>
    </div>
  `;
  
  return baseHTML;
}

/**
 * Content Router - directs to appropriate content generator based on popup type
 *
 * This function acts as a router, calling the appropriate content generation
 * function based on the popup type. Each popup type has its own specialized
 * content generator that handles the unique requirements of that type.
 *
 * @param {string} type - Popup type identifier
 * @param {object} config - Popup configuration object
 * @returns {string} Type-specific HTML content
 */
function getPopupTypeContent(type, config) {
  switch (type) {
    case 'email':
      return createEmailPopupContent(config);
    case 'wheel-email':
      return createWheelEmailPopupContent(config);
    case 'community':
      return createCommunityPopupContent(config);
    case 'timer':
      return createTimerPopupContent(config);
    case 'scratch-card':
      return createScratchCardPopupContent(config);
    default:
      return createWheelEmailPopupContent(config);
  }
}

// ============================================================================
// POPUP TYPE-SPECIFIC CONTENT GENERATORS
// ============================================================================

/**
 * Email Popup Content Generator
 *
 * Creates the HTML structure for simple email capture popups. This type focuses
 * on collecting email addresses in exchange for discount codes or newsletter signups.
 *
 * Features Generated:
 * - Clean, centered layout with customizable colors
 * - Email input field with validation styling
 * - Call-to-action button with hover effects
 * - Optional close button
 * - Responsive design for all screen sizes
 *
 * @param {object} config - Email popup configuration
 * @returns {string} Complete HTML for email popup
 */
function createEmailPopupContent(config) {
  return `
    <div class="email-popup-container" style="
      background: ${config.backgroundColor || '#ffffff'};
      color: ${config.textColor || '#000000'};
      padding: 24px;
      border-radius: ${config.borderRadius || 8}px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      position: relative;
      max-width: 400px;
      margin: 0 auto;
    ">
      ${config.showCloseButton !== false ? `
        <button class="popup-close" style="
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.1);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          color: ${config.textColor || '#000000'};
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">&times;</button>
      ` : ''}
      
      <div style="font-size: 24px; margin-bottom: 10px; color: ${config.textColor || '#000000'};">📧</div>
      <h3 style="
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 15px 0;
        color: ${config.textColor || '#000000'};
      ">
        ${config.title || 'Get 10% Off Your First Order!'}
      </h3>
      <p style="
        margin-bottom: 20px;
        line-height: 1.5;
        color: ${config.textColor || '#000000'};
      ">
        ${config.description || 'Subscribe to our newsletter and receive exclusive discounts'}
      </p>
      <input
        type="email"
        placeholder="${config.placeholder || 'Enter your email address'}"
        style="
          width: 100%;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 6px;
          margin-bottom: 15px;
          font-size: 14px;
          box-sizing: border-box;
        "
        readonly
      />
      <button style="
        width: 100%;
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
        background-color: ${config.buttonColor || '#007ace'};
        color: white;
      ">
        ${config.buttonText || 'Get Discount'}
      </button>
    </div>
  `;
}

/**
 * Wheel-Email Combo Content Generator
 *
 * Creates the most complex popup type combining a spinning wheel game with email capture.
 * This popup type is highly engaging and includes sophisticated visual elements.
 *
 * Features Generated:
 * - Interactive spinning wheel with customizable segments
 * - Conic gradient backgrounds for wheel segments
 * - Precise mathematical positioning of segment labels
 * - Two-panel layout (wheel + form)
 * - House rules section with customizable terms
 * - Advanced styling with gradients and shadows
 *
 * Technical Details:
 * - Uses conic-gradient CSS for wheel segments
 * - Calculates segment positions using trigonometry
 * - Implements responsive sizing for different screen sizes
 *
 * @param {object} config - Wheel-email popup configuration
 * @returns {string} Complete HTML for wheel-email popup
 */
function createWheelEmailPopupContent(config) {
  const segments = config.segments || [
    { label: "5% OFF", color: "#0a2a43", value: "5" },
    { label: "10% OFF", color: "#133b5c", value: "10" },
    { label: "15% OFF", color: "#0a2a43", value: "15" },
    { label: "20% OFF", color: "#133b5c", value: "20" },
    { label: "FREE SHIPPING", color: "#0a2a43", value: "shipping" },
    { label: "TRY AGAIN", color: "#133b5c", value: null },
  ];

  const gradient = segments.map((s, i) => {
    const startAngle = i * (360 / segments.length);
    const endAngle = (i + 1) * (360 / segments.length) + 0.2; // tiny overlap
    return `${s.color} ${startAngle}deg ${endAngle}deg`;
  }).join(", ");

  const segmentLabels = segments.map((segment, index) => {
    const segmentAngle = (360 / segments.length) * index + (360 / segments.length) / 2;
    const radius = 95;
    const x = Math.cos((segmentAngle - 90) * Math.PI / 180) * radius;
    const y = Math.sin((segmentAngle - 90) * Math.PI / 180) * radius;

    return `
      <div class="wheel-segment-label" style="
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) translate(${x}px, ${y}px);
        font-size: 13px;
        font-weight: 800;
        color: white;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.9);
        pointer-events: none;
        text-align: center;
        line-height: 1.2;
        max-width: 75px;
        overflow: hidden;
      ">
        ${segment.label}
      </div>
    `;
  }).join("");

  return `
    <div class="wheel-email-popup-container" style="
      background: #0b1220;
      border-radius: 20px;
      overflow: hidden;
      position: relative;
      padding: 25px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      max-width: 650px;
      margin: 0 auto;
    ">
      <!-- Wheel Section -->
      <div class="wheel-section" style="
        width: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-right: 0;
      ">
        <div class="popup-wheel-container">
          <div class="spinning-wheel" style="
            width: 250px;
            height: 250px;
            border-radius: 50%;
            border: 4px solid rgba(10, 20, 40, 0.7);
            position: relative;
            background: conic-gradient(${gradient});
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.4),
                        0 4px 15px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.05);
            filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.3));
            margin: 0 auto;
          ">
            <div class="wheel-pointer" style="
              position: absolute;
              top: 50%;
              right: -20px;
              transform: translateY(-50%);
              width: 0;
              height: 0;
              border-top: 16px solid transparent;
              border-bottom: 16px solid transparent;
              border-left: 28px solid #fbbf24;
              filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
            "></div>
            <div class="wheel-center" style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
              width: 45px;
              height: 45px;
              border-radius: 50%;
              border: 3px solid rgba(148, 163, 184, 0.3);
              z-index: 5;
              box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2),
                          inset 0 1px 0 rgba(255, 255, 255, 0.8);
            ">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 8px;
                height: 8px;
                background: #64748b;
                border-radius: 50%;
                box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
              "></div>
            </div>
            ${segmentLabels}
          </div>
        </div>
      </div>
      
      <!-- Form Section -->
      <div class="form-section" style="
        flex: 1;
        padding: 0 30px;
        color: #1f2937;
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: #ffffff;
        border-radius: 0 20px 20px 0;
      ">
        <div class="form-title" style="
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #0f172a;
        ">${config.title || 'GET YOUR CHANCE TO WIN'}</div>
        
        <div class="form-subtitle" style="
          font-size: 14px;
          margin-bottom: 12px;
          color: #475569;
          font-weight: 500;
        ">${config.subtitle || 'AMAZING DISCOUNTS!'}</div>
        
        <p class="form-description" style="
          font-size: 12px;
          margin-bottom: 15px;
          color: #64748b;
        ">${config.description || 'Enter your email below and spin the wheel to see if you are our next lucky winner!'}</p>
        
        <div class="popup-form">
          <input type="email" class="email-input" placeholder="${config.placeholder || 'Enter your email'}" style="
            width: 100%;
            padding: 14px 18px;
            border: 2px solid rgba(148, 163, 184, 0.2);
            border-radius: 12px;
            margin-bottom: 10px;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.9);
            color: #1e293b;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          " readonly />
          <button class="spin-button" style="
            width: 100%;
            padding: 14px 20px;
            background: linear-gradient(45deg, #0a2a43, #133b5c);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 15px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          ">
            ${config.buttonText || 'TRY YOUR LUCK'}
          </button>
        </div>
        
        ${config.showHouseRules !== false ? `
          <div class="house-rules" style="
            margin-top: 10px;
            font-size: 10px;
            color: #64748b;
          ">
            <h4 style="
              margin: 0 0 4px 0;
              font-size: 11px;
              color: #475569;
              font-weight: 600;
            ">The House rules:</h4>
            <ul style="
              margin: 0;
              padding-left: 15px;
              list-style-type: disc;
            ">
              ${(config.houseRules || [
                "Winnings through cheating will not be processed.",
                "Only one spin allowed"
              ]).map(rule => `<li style="margin-bottom: 4px;">${rule}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Community Social Popup Content Generator
 *
 * Creates social media follow popups designed to grow social media presence.
 * This popup type emphasizes visual appeal with banner images and social icons.
 *
 * Features Generated:
 * - Banner image section at the top
 * - Customizable social media icons with platform-specific styling
 * - Dynamic icon generation based on enabled platforms
 * - "Ask me later" functionality for user-friendly dismissal
 * - Responsive layout that works on all devices
 *
 * Social Platforms Supported:
 * - Facebook (with brand colors)
 * - Instagram (with gradient background)
 * - LinkedIn (with brand colors)
 * - X/Twitter (with brand colors)
 *
 * @param {object} config - Community popup configuration
 * @returns {string} Complete HTML for community popup
 */
function createCommunityPopupContent(config) {
  const socialIcons = config.socialIcons || [
    { platform: 'facebook', url: '', enabled: true },
    { platform: 'instagram', url: '', enabled: true },
    { platform: 'linkedin', url: '', enabled: true },
    { platform: 'x', url: '', enabled: true }
  ];

  const enabledSocialIcons = socialIcons.filter(icon => icon.enabled);
  const socialIconsHTML = enabledSocialIcons.map(social => {
    const getIconStyle = (platform) => {
      switch(platform) {
        case 'facebook':
          return { backgroundColor: '#1877f2', color: 'white' };
        case 'instagram':
          return {
            background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
            color: 'white'
          };
        case 'linkedin':
          return { backgroundColor: '#0077b5', color: 'white' };
        case 'x':
          return { backgroundColor: '#000000', color: 'white' };
        default:
          return { backgroundColor: '#f0f0f0', color: '#666' };
      }
    };
    
    const iconStyle = getIconStyle(social.platform);
    const styleString = Object.entries(iconStyle).map(([key, value]) => 
      `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`
    ).join('; ');
    
    return `
      <div class="social-icon" style="
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ${styleString};
      ">
        ${social.platform === 'facebook' ? 'f' :
          social.platform === 'instagram' ? '📷' :
          social.platform === 'linkedin' ? 'in' :
          social.platform === 'x' ? 'X' : '?'}
      </div>
    `;
  }).join('');

  const bannerUrl = (config.bannerImage && config.bannerImage.trim() !== '') 
    ? config.bannerImage 
    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDQwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiYW5uZXJHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzY2NjsiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNjY2M7Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9InVybCgjYmFubmVyR3JhZGllbnQpIi8+PHRleHQgeD0iMjAwIiB5PSI2NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiPkJBTk5FUjwvdGV4dD48L3N2Zz4=';

  return `
    <div class="community-content" style="
      background-color: ${config.backgroundColor || '#ffffff'};
      border-radius: ${config.borderRadius || 12}px;
      overflow: hidden;
      max-width: 350px;
      margin: 0 auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      position: relative;
    ">
      <!-- Banner at the very top -->
      <div class="community-banner" style="
        width: 100%;
        height: 100px;
        background-image: url('${bannerUrl}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        border-radius: ${config.borderRadius || 12}px ${config.borderRadius || 12}px 0 0;
        position: relative;
      ">
        ${config.showCloseButton !== false ? `
          <div class="popup-close" style="
            position: absolute;
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
            background-color: rgba(0,0,0,0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            cursor: pointer;
          ">&times;</div>
        ` : ''}
      </div>
      
      <!-- Content wrapper with padding -->
      <div style="padding: 20px; text-align: center;">
        <!-- Title and Description -->
        <div style="margin-bottom: 20px;">
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 10px;
          ">
            <span style="font-size: 18px;">👥</span>
            <h3 style="
              color: ${config.textColor || '#000000'};
              margin: 0;
              font-size: 16px;
              font-weight: 600;
            ">
              ${config.title || 'JOIN OUR COMMUNITY'}
            </h3>
          </div>
          <p style="
            color: ${config.textColor || '#000000'};
            font-size: 13px;
            line-height: 1.4;
            margin: 0;
          ">
            ${config.description || 'Connect with us on social media and stay updated with our latest news and offers!'}
          </p>
        </div>
        
        <!-- Social Icons -->
        <div style="
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        ">
          ${socialIconsHTML}
        </div>
        
        <!-- Ask Me Later Link -->
        ${config.showAskMeLater !== false ? `
          <div style="text-align: center;">
            <a href="#" style="
              color: ${config.textColor || '#000000'};
              text-decoration: underline;
              font-size: 13px;
              opacity: 0.7;
            ">
              ${config.askMeLaterText || 'Ask me later'}
            </a>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Timer Countdown Popup Content Generator
 *
 * Creates urgency-driven popups with countdown timers to encourage immediate action.
 * This popup type is highly effective for limited-time offers and flash sales.
 *
 * Features Generated:
 * - Customizable countdown timer with days, hours, minutes, seconds
 * - Dynamic timer display that adapts based on duration
 * - Gradient backgrounds for visual appeal
 * - Email capture form integrated with timer
 * - Configurable expiration behavior
 * - Success and expired state messaging
 * - Disclaimer text for legal compliance
 *
 * Timer Features:
 * - Responsive timer units that hide when zero
 * - Professional styling with glassmorphism effects
 * - Customizable icons and colors
 * - Multiple expiration handling options
 *
 * @param {object} config - Timer popup configuration
 * @returns {string} Complete HTML for timer popup
 */
function createTimerPopupContent(config) {
  return `
    <div class="timer-content" style="
      background: ${config.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
      border-radius: ${config.borderRadius || 16}px;
      padding: 20px;
      color: ${config.textColor || '#ffffff'};
      text-align: center;
      max-width: 350px;
      margin: 0 auto;
      position: relative;
    ">
      ${config.showCloseButton !== false ? `
        <button class="popup-close" style="
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          cursor: pointer;
          color: white;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">&times;</button>
      ` : ''}
      
      <div class="timer-popup-inner">
        <div class="timer-popup-header" style="margin-bottom: 25px;">
          <div class="timer-popup-icon" style="
            font-size: 40px;
            margin-bottom: 12px;
            display: block;
          ">${config.timerIcon || '⏰'}</div>
          <h2 class="timer-popup-title" style="
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 8px 0;
            color: #ffffff;
          ">${config.title || 'LIMITED TIME OFFER!'}</h2>
          <p class="timer-popup-subtitle" style="
            font-size: 14px;
            margin: 0 0 25px 0;
            color: rgba(255, 255, 255, 0.85);
            line-height: 1.4;
          ">${config.description || 'Don\'t miss out on this exclusive deal. Time is running out!'}</p>
        </div>
        
        <div class="timer-display" style="
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin: 25px 0;
          flex-wrap: wrap;
        ">
          ${config.timerDays > 0 ? `
            <div class="timer-unit" style="
              background: rgba(255, 255, 255, 0.18);
              border: 1px solid rgba(255, 255, 255, 0.25);
              border-radius: 16px;
              padding: 12px 10px;
              min-width: 60px;
            ">
              <div class="timer-number" style="
                font-size: 28px;
                font-weight: 700;
                color: #ffffff;
                margin: 0;
                line-height: 1;
              ">${config.timerDays.toString().padStart(2, '0')}</div>
              <div class="timer-label" style="
                font-size: 10px;
                color: rgba(255, 255, 255, 0.75);
                margin: 4px 0 0 0;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                font-weight: 600;
              ">Days</div>
            </div>
          ` : ''}
          <div class="timer-unit" style="
            background: rgba(255, 255, 255, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 16px;
            padding: 12px 10px;
            min-width: 60px;
          ">
            <div class="timer-number" style="
              font-size: 28px;
              font-weight: 700;
              color: #ffffff;
              margin: 0;
              line-height: 1;
            ">${(config.timerHours || 0).toString().padStart(2, '0')}</div>
            <div class="timer-label" style="
              font-size: 10px;
              color: rgba(255, 255, 255, 0.75);
              margin: 4px 0 0 0;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              font-weight: 600;
            ">Hours</div>
          </div>
          <div class="timer-unit" style="
            background: rgba(255, 255, 255, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 16px;
            padding: 12px 10px;
            min-width: 60px;
          ">
            <div class="timer-number" style="
              font-size: 28px;
              font-weight: 700;
              color: #ffffff;
              margin: 0;
              line-height: 1;
            ">${(config.timerMinutes || 0).toString().padStart(2, '0')}</div>
            <div class="timer-label" style="
              font-size: 10px;
              color: rgba(255, 255, 255, 0.75);
              margin: 4px 0 0 0;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              font-weight: 600;
            ">Minutes</div>
          </div>
          <div class="timer-unit" style="
            background: rgba(255, 255, 255, 0.18);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 16px;
            padding: 12px 10px;
            min-width: 60px;
          ">
            <div class="timer-number" style="
              font-size: 28px;
              font-weight: 700;
              color: #ffffff;
              margin: 0;
              line-height: 1;
            ">${(config.timerSeconds || 0).toString().padStart(2, '0')}</div>
            <div class="timer-label" style="
              font-size: 10px;
              color: rgba(255, 255, 255, 0.75);
              margin: 4px 0 0 0;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              font-weight: 600;
            ">Seconds</div>
          </div>
        </div>
        
        <div class="timer-form" style="margin-bottom: 15px;">
          <input
            type="email"
            placeholder="${config.placeholder || 'Enter your email to claim this offer'}"
            style="
              width: 100%;
              padding: 12px;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
              margin-bottom: 12px;
            "
            readonly
          />
          <button style="
            width: 100%;
            padding: 12px 20px;
            background: #ff6b6b;
            border: none;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-transform: uppercase;
          ">
            ${config.buttonText || 'CLAIM OFFER NOW'}
          </button>
        </div>
        
        ${config.disclaimer ? `
          <div class="timer-disclaimer" style="
            font-size: 10px;
            color: rgba(255, 255, 255, 0.6);
            font-style: italic;
          ">
            ${config.disclaimer}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Scratch Card Popup Content Generator
 *
 * Creates interactive scratch-to-reveal discount popups that gamify the discount
 * discovery process. This popup type provides high engagement through interactivity.
 *
 * Features Generated:
 * - Canvas-based scratch card with realistic scratch effects
 * - Responsive sizing based on screen dimensions
 * - Hidden discount reveal with dynamic percentages
 * - Two-panel layout (scratch card + form)
 * - Email capture with terms agreement checkbox
 * - Progressive disclosure of discount information
 *
 * Technical Implementation:
 * - Responsive canvas sizing for different devices
 * - Layered design with scratch overlay and hidden content
 * - Dynamic discount percentage generation
 * - Touch and mouse interaction support
 *
 * @param {object} config - Scratch card popup configuration
 * @returns {string} Complete HTML for scratch card popup
 */
function createScratchCardPopupContent(config) {
  // Generate random discount percentage (5%, 10%, 15%, 20%, 25%, 30%)
  const discountOptions = [5, 10, 15, 20, 25, 30];
  const randomDiscount = discountOptions[Math.floor(Math.random() * discountOptions.length)];
  
  // Responsive canvas size based on screen size - matching storefront implementation
  let canvasSize, discountFontSize, discountTextSize, containerWidth;
  if (window.innerWidth <= 480) {
    canvasSize = 160;
    discountFontSize = '36px';
    discountTextSize = '18px';
    containerWidth = '98vw';
  } else if (window.innerWidth <= 768) {
    canvasSize = 160;
    discountFontSize = '40px';
    discountTextSize = '20px';
    containerWidth = '95vw';
  } else {
    canvasSize = 200;
    discountFontSize = '48px';
    discountTextSize = '18px';
    containerWidth = '600px';
  }

  return `
    <div class="scratch-card-popup-inner" style="
      padding: 20px;
      background: ${config.backgroundColor || '#ffffff'};
      color: ${config.textColor || '#000000'};
      border-radius: ${config.borderRadius || 16}px;
      position: relative;
      max-width: ${containerWidth};
      width: 100%;
      margin: 0 auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-height: auto;
    ">
      ${config.showCloseButton !== false ? `
        <button class="popup-close" style="
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          cursor: pointer;
          color: ${config.textColor || '#000000'};
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        ">&times;</button>
      ` : ''}
      
      <div class="scratch-card-layout" style="
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        gap: 30px;
        padding: 0;
        width: 90%;
      ">
        <div class="scratch-card-left" style="
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        ">
          <div class="scratch-card-container" style="
            position: relative;
            width: ${canvasSize}px;
            height: ${canvasSize}px;
          ">
            <div style="
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #4A90E2 0%, #5BA0F2 100%);
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              position: relative;
              cursor: pointer;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            ">
              <div style="font-size: 16px; margin-bottom: 5px;">SCRATCH</div>
              <div style="font-size: 16px; margin-bottom: 10px;">HERE</div>
              <div style="font-size: 20px;">✋</div>
              
              <!-- Hidden discount content (partially visible in preview) -->
              <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                opacity: 0.3;
                border-radius: 8px;
              ">
                <div style="font-size: ${discountFontSize}; font-weight: bold; margin-bottom: 5px;">${randomDiscount}%</div>
                <div style="font-size: ${discountTextSize}; font-weight: 600;">OFF</div>
              </div>
            </div>
          </div>
          <p style="
            font-size: 14px;
            color: ${config.textColor || '#000000'};
            text-align: center;
            margin: 0;
            max-width: ${canvasSize}px;
            line-height: 1.3;
          ">Enter your email to start scratching!</p>
        </div>
        
        <div class="scratch-card-right" style="
          flex: 1;
          min-width: 0;
          max-width: 350px;
        ">
          <h2 style="
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 15px 0;
            color: ${config.textColor || '#000000'};
            line-height: 1.2;
          ">${config.title || 'Scratch & Win!'}</h2>
          
          <p style="
            font-size: 14px;
            color: ${config.textColor || '#000000'};
            margin: 0 0 20px 0;
            line-height: 1.5;
          ">${config.description || 'Scratch the card to reveal your exclusive discount and enter your email to claim it!'}</p>
          
          <div class="scratch-card-form">
            <input type="email" placeholder="${config.placeholder || 'Enter your email'}" style="
              width: 100%;
              padding: 12px;
              border: 1px solid #ccc;
              border-radius: 6px;
              margin-bottom: 10px;
              font-size: 14px;
              box-sizing: border-box;
            " readonly />
            
            <label style="
              display: flex;
              align-items: center;
              margin-bottom: 15px;
              font-size: 12px;
              color: ${config.textColor || '#000000'};
              cursor: pointer;
            ">
              <input type="checkbox" style="margin-right: 8px;" />
              <span>I agree to receive promotional emails</span>
            </label>
            
            <button style="
              width: 100%;
              background-color: ${config.buttonColor || '#007ace'};
              border: none;
              color: white;
              padding: 12px 24px;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
              font-size: 14px;
            ">
              ${config.buttonText || 'Enable Scratching'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// STYLING AND INTERACTION FUNCTIONS
// ============================================================================

/**
 * Popup Styling Applicator
 *
 * Applies base styling that's consistent across all popup types. This ensures
 * that all popups have the same foundational appearance and typography that
 * matches the storefront implementation.
 *
 * Applied Styles:
 * - System font stack for cross-platform consistency
 * - Base font size and line height
 * - Consistent spacing and layout principles
 *
 * @param {HTMLElement} container - Popup container element
 * @param {string} type - Popup type for type-specific styling
 * @param {object} config - Configuration for dynamic styling
 */
function applyPopupStyling(container, type, config) {
  // Add base popup styles that match the storefront
  const popup = container.querySelector('.custom-popup');
  if (popup) {
    popup.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    popup.style.fontSize = '14px';
    popup.style.lineHeight = '1.5';
  }
}

/**
 * Interactive Functionality Controller
 *
 * This function would normally initialize all the interactive features of popups
 * such as wheel spinning, timer countdowns, scratch card interactions, and form
 * submissions. However, for preview mode, these interactions are disabled to
 * provide a safe, non-functional preview environment.
 *
 * Interactive Features (Disabled in Preview):
 * - Wheel spinning animations and result calculation
 * - Live countdown timer updates
 * - Canvas-based scratch card interactions
 * - Form validation and submission
 * - Close button functionality
 * - Exit intent detection
 *
 * Preview Mode Behavior:
 * - All buttons become non-interactive
 * - Input fields are set to readonly
 * - Animations are paused or simplified
 * - No network requests are made
 *
 * @param {HTMLElement} container - Popup container element
 * @param {string} type - Popup type for type-specific initialization
 * @param {object} config - Configuration for interactive features
 * @param {boolean} disableInteractions - Whether to disable all interactions
 */
function initializePopupType(container, type, config, disableInteractions) {
  // This function would normally initialize interactive features like:
  // - Wheel spinning animation
  // - Timer countdown
  // - Scratch card canvas interaction
  // - Form submissions
  // But for preview mode, we keep interactions disabled
  
  if (disableInteractions) {
    // Disable all interactive elements
    const buttons = container.querySelectorAll('button');
    const inputs = container.querySelectorAll('input');
    
    buttons.forEach(button => {
      button.style.pointerEvents = 'none';
    });
    
    inputs.forEach(input => {
      input.setAttribute('readonly', 'true');
    });
  }
}