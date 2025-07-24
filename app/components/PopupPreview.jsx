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
  
  // Create type-specific container styles
  const getContainerStyle = () => {
    const baseStyle = {
      position: 'relative',
      width: 'auto',
      height: 'auto',
      margin: '0px auto',
    };

    switch (type) {
      case 'email':
        return {
          ...baseStyle,
          maxWidth: 575,
          width:100,
          borderRadius: '8px',
          ...style  // Email-specific style spread
        };
      case 'wheel-email':
        return {
          ...baseStyle,
          maxWidth: 705,
          ...style
        };
      case 'community':
        return {
          ...baseStyle,
          maxWidth: 400,
          ...style
        };
      case 'timer':
        return {
          ...baseStyle,
          maxWidth: 420,
          ...style
        };
      case 'scratch-card':
        return {
          ...baseStyle,
          maxWidth: 700,
          ...style
        };
      default:
        return {
          ...baseStyle,
          maxWidth: 600,
          ...style
        };
    }
  };

  return (
    <div
      ref={popupRef}
      className={`popup-preview ${className}`}
      style={getContainerStyle()}
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
    <style>
      /* Email Popup Styles - matching popup-styles.css */
      .custom-popup.email-popup {
        max-width: 600px !important;
        display: block !important;
        padding: 0 !important;
        background: #ffffff !important;
        border-radius: 8px !important;
        overflow: hidden !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      }

      .custom-popup.email-popup .popup-content {
        display: flex !important;
        align-items: stretch !important;
        padding: 0 !important;
        min-height: 320px !important;
      }

      .email-popup-wrapper {
        display: flex;
        width: 100%;
        border-radius: 8px;
      }

      .email-popup-image {
        flex: 1;
        max-width: 50%;
        overflow: hidden;
      }

      .email-popup-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .email-popup-content {
        flex: 1;
        background: #f9f9f9;
        padding: 40px 30px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: left;
      }

      .email-popup-title {
        font-size: 24px;
        font-weight: 800;
        margin: 0 0 8px 0;
        color: #000;
        text-transform: uppercase;
      }

      .email-popup-subtitle {
        font-size: 14px;
        font-weight: 500;
        margin: 0 0 10px 0;
        color: #555;
      }

      .email-popup-desc {
        font-size: 13px;
        margin-bottom: 18px;
        color: #777;
        line-height: 1.4;
      }

      .email-popup-content input[type="email"] {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #ddd;
        border-radius: 6px;
        margin-bottom: 12px;
        font-size: 14px;
        outline: none;
      }

      .email-popup-content input[type="email"]:focus {
        border-color: #007ace;
      }

      .email-popup-button {
        width: 100%;
        padding: 12px;
        background: #007ace;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 700;
        font-size: 14px;
        text-transform: uppercase;
        transition: background 0.2s ease-in-out;
      }

      .email-popup-button:hover {
        background: #005f99;
      }

      .email-popup-note {
        font-size: 11px;
        margin-top: 8px;
        color: #999;
        text-align: center;
      }

      .custom-popup.email-popup .popup-close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.1);
        border: none;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        z-index: 10;
      }

      .custom-popup.email-popup .popup-close:hover {
        background: rgba(0, 0, 0, 0.2);
      }

      /* Responsive Media Queries for Popup Preview */
      @media (max-width: 768px) {
        .custom-popup.wheel-email-popup {
          flex-direction: column !important;
          max-width: 95vw !important;
          min-height: auto !important;
        }
        .custom-popup.wheel-email-popup .wheel-section {
          width: 100% !important;
          padding: 15px !important;
        }
        .custom-popup.wheel-email-popup .spinning-wheel {
          width: 220px !important;
          height: 220px !important;
        }
        .custom-popup.wheel-email-popup .form-section {
          border-radius: 0 0 20px 20px !important;
          padding: 20px !important;
        }
        .custom-popup.timer-popup {
          max-width: 95vw !important;
        }
        .custom-popup.scratch-card-popup {
          max-width: 95vw !important;
        }
        .custom-popup.scratch-card-popup .scratch-card-layout {
          flex-direction: column !important;
          gap: 20px !important;
        }
        .custom-popup.scratch-card-popup .scratch-card-right {
          max-width: 100% !important;
        }
      }

      /* Email popup responsive */
      @media (max-width: 480px) {
        .custom-popup {
          margin: 10px !important;
          border-radius: 12px !important;
        }
        .custom-popup.email-popup {
          max-width: 95vw !important;
        }

        .custom-popup.email-popup .popup-content {
          flex-direction: column !important;
        }

        .email-popup-wrapper {
          flex-direction: column !important;
        }

        .email-popup-image {
          max-width: 100% !important;
          height: 150px !important;
        }

        .email-popup-content {
          padding: 25px 20px;
          text-align: center;
        }

        .email-popup-title {
          font-size: 20px;
        }
        
        .custom-popup.wheel-email-popup .spinning-wheel {
          width: 180px !important;
          height: 180px !important;
        }
        .custom-popup.timer-popup .timer-display {
          gap: 8px !important;
        }
        .custom-popup.timer-popup .timer-unit {
          min-width: 50px !important;
          padding: 8px 6px !important;
        }
        .custom-popup.timer-popup .timer-number {
          font-size: 20px !important;
        }
        .custom-popup.scratch-card-popup .scratch-card-container {
          width: 140px !important;
          height: 140px !important;
        }
      }
      
      /* Base popup styling */
      .custom-popup {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        box-sizing: border-box;
      }
      
      .custom-popup * {
        box-sizing: border-box;
      }
      
      .popup-close {
        transition: all 0.2s ease;
      }
      
      .popup-close:hover {
        background: rgba(0, 0, 0, 0.2) !important;
        transform: scale(1.1);
      }
    </style>
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
  // Default image fallback to match real popup
  const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='320' viewBox='0 0 300 320'%3E%3Crect width='300' height='320' fill='%23888'/%3E%3Ctext x='150' y='160' text-anchor='middle' fill='white' font-size='16'%3EBANNER%3C/text%3E%3C/svg%3E";
  const imageUrl = config.bannerImage || defaultImage;

  // Match the exact structure from popup.js lines 417-441
  return `
    <button class="popup-close" style="
      position: absolute; top: 10px; right: 10px; z-index: 10;
      background: rgba(0,0,0,0.1); border: none; border-radius: 50%;
      width: 28px; height: 28px; font-size: 16px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: ${config.textColor || "#000000"};
    ">&times;</button>

    <div class="email-popup-wrapper">
      <div class="email-popup-image">
        <img src="${imageUrl}" alt="Popup" onerror="this.style.display='none'" />
      </div>
      <div class="email-popup-content">
        <h3 class="email-popup-title">${config.title || "GET 15% OFF"}</h3>
        <p class="email-popup-subtitle">${config.subtitle || "Your first order"}</p>
        <p class="email-popup-desc">${config.description || "Stay updated with our latest products"}</p>
        <input type="email" id="popup-email" placeholder="${config.placeholder || "Enter your email"}" />
        <button onclick="handleEmailSubmit()" class="email-popup-button" style="background-color: ${config.buttonColor || '#1b1e21ff'}; border: none; color: white;">
          ${config.buttonText || "SUBSCRIBE"}
        </button>
        <p class="email-popup-note">No thanks, I'll pay full price</p>
      </div>
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
  // Use hardcoded segments to match real popup implementation
  const segments = [
    { label: "5% OFF", color: "#0a2a43", value: "5" },
    { label: "10% OFF", color: "#133b5c", value: "10" },
    { label: "15% OFF", color: "#0a2a43", value: "15" },
    { label: "20% OFF", color: "#133b5c", value: "20" },
    { label: "FREE SHIPPING", color: "#0a2a43", value: "shipping" },
    { label: "TRY AGAIN", color: "#133b5c", value: null },
  ];

  const angle = 360 / segments.length;
  // Create premium gradient with subtle transitions to match real popup
  const gradient = segments
    .map((s, i) => {
      const startAngle = i * angle;
      const endAngle = (i + 1) * angle;
      const midAngle = startAngle + angle * 0.5;

      // Add subtle gradient within each segment for depth
      return `${s.color} ${startAngle}deg, ${s.color}dd ${midAngle}deg, ${s.color} ${endAngle}deg`;
    })
    .join(", ");

  // Create segment labels with horizontal text positioned within wheel - matching real popup
  const segmentLabels = segments
    .map((segment, index) => {
      const segmentAngle = (360 / segments.length) * index + 360 / segments.length / 2;

      // Responsive radius based on screen size to match real popup
      let radius = window.innerWidth <= 480 ? 55 : window.innerWidth <= 768 ? 70 : 90;
      let fontSize = window.innerWidth <= 480 ? "10px" : window.innerWidth <= 768 ? "12px" : "14px";

      const x = Math.cos(((segmentAngle - 90) * Math.PI) / 180) * radius;
      const y = Math.sin(((segmentAngle - 90) * Math.PI) / 180) * radius;

      return `
        <div class="wheel-segment-label" style="
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${segmentAngle}deg);
          font-size: ${fontSize};
          font-weight: bold;
          text-transform: uppercase;
          color: white;
          letter-spacing: 0.5px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
          max-width: 60px;
          text-align: center;
          pointer-events: none;
        ">
          ${segment.label}
        </div>
      `;
    })
    .join("");

  return `
    <div class="custom-popup wheel-email-popup" style="
      background: linear-gradient(135deg, #09090aff 0%, #2a5298 100%);
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
      max-width: 705px;
      width: 100%;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: stretch;
      border: none;
      min-height: 350px;
      max-height: 450px;
    ">
      <div class="popup-content" style="
        padding: 0;
        display: flex;
        width: 100%;
        min-height: 330px;
        max-height: 430px;
      ">
        <!-- Wheel Section -->
        <div class="wheel-section" style="
          width: 300px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow: hidden;
        ">
          <div style="position: relative; display: inline-block;">
            <div class="spinning-wheel" style="
              width: 280px;
              height: 280px;
              border-radius: 50%;
              border: 4px solid rgba(255, 255, 255, 0.15);
              position: relative;
              background: conic-gradient(${gradient});
              box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.1);
              filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
              margin: 0 auto;
            ">
              <div class="wheel-center" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 3px solid rgba(148, 163, 184, 0.3);
                z-index: 5;
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 0 rgba(0, 0, 0, 0.1);
              ">
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  width: 8px;
                  height: 8px;
                  background: #08162aff;
                  border-radius: 50%;
                  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
                "></div>
              </div>
              ${segmentLabels}
            </div>
            // <div class="wheel-pointer" style="
            //   position: absolute;
            //   top: 50%;
            //   right: -18px;
            //   transform: translateY(-50%);
            //   width: 0;
            //   height: 0;
            //   border-top: 16px solid transparent;
            //   border-bottom: 16px solid transparent;
            //   border-left: 28px solid #fbbf24;
            //   z-index: 10;
            //   filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4));
            // "></div>
          </div>
        </div>
        
        <!-- Form Section -->
        <div class="form-section" style="
          flex: 1;
          padding: 25px 30px;
          color: #1f2937;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
          backdrop-filter: blur(10px);
          border-radius: 0 20px 20px 0;
          box-shadow: none;
        ">
          <div class="form-title" style="
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #0f172a;
            text-shadow: none;
            letter-spacing: -0.3px;
          ">${config.title || 'GET YOUR CHANCE TO WIN'}</div>
          
          <div class="form-subtitle" style="
            font-size: 14px;
            margin-bottom: 15px;
            color: #475569;
            line-height: 1.3;
            font-weight: 500;
          ">${config.subtitle || 'AMAZING DISCOUNTS!'}</div>
          
          <p class="form-description" style="
            font-size: 12px;
            margin-bottom: 15px;
            color: #64748b;
            line-height: 1.3;
            font-weight: 400;
          ">${config.description || 'Enter your email below and spin the wheel to see if you are our next lucky winner!'}</p>
          
          <div class="popup-form" style="
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 0;
            margin: 0;
          ">
            <input type="email" class="email-input" placeholder="${config.placeholder || 'Enter your email'}" style="
              width: 100%;
              padding: 14px 18px;
              border: 2px solid rgba(148, 163, 184, 0.2);
              border-radius: 12px;
              margin-bottom: 15px;
              font-size: 16px;
              box-sizing: border-box;
              background: rgba(255, 255, 255, 0.8);
              color: #1e293b;
              transition: all 0.3s ease;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
            " readonly />
            <button class="spin-button" style="
              width: 100%;
              padding: 14px 20px;
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              border: none;
              border-radius: 12px;
              color: white;
              font-size: 15px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              text-transform: uppercase;
              letter-spacing: 0.6px;
              position: relative;
              overflow: hidden;
              box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
            ">
              ${config.buttonText || 'TRY YOUR LUCK'}
            </button>
          </div>
          
          ${config.showHouseRules !== false ? `
            <div class="house-rules" style="
              margin-top: 12px;
              font-size: 10px;
              color: #64748b;
              text-align: left;
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
                ]).map(rule => `<li style="margin-bottom: 4px; line-height: 1.3;">${rule}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
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
      max-width: 400px;
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
 * @param {object} config - Timer popup configuration
 * @returns {string} Complete HTML for timer popup
 */
function createTimerPopupContent(config) {
  return `
    <div class="custom-popup timer-popup" style="
      max-width: 420px;
      width: 100%;
      display: block;
      background: ${config.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
      border-radius: 20px;
      box-shadow: 0 25px 70px rgba(102, 126, 234, 0.5), 0 10px 30px rgba(118, 75, 162, 0.3);
      overflow: hidden;
      position: relative;
      border: none;
    ">
      <div class="popup-content" style="
        display: block;
        min-height: auto;
        position: relative;
      ">
        <div class="timer-content" style="
          display: block;
          width: 100%;
          padding: 0;
          position: relative;
        ">
          <div class="timer-popup-inner" style="
            padding: 30px 25px 25px;
            text-align: center;
            position: relative;
          ">
            ${config.showCloseButton !== false ? `
              <button class="popup-close" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                cursor: pointer;
                color: white;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                z-index: 10;
              ">&times;</button>
            ` : ''}
            
            <div class="timer-popup-header" style="margin-bottom: 25px;">
              <div class="timer-popup-icon" style="
                font-size: 40px;
                margin-bottom: 12px;
                display: block;
                filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
              ">${config.timerIcon || '⏰'}</div>
              <h2 class="timer-popup-title" style="
                font-size: 24px;
                font-weight: 700;
                margin: 0 0 8px 0;
                color: #ffffff;
                text-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
                letter-spacing: -0.3px;
                background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              ">${config.title || 'LIMITED TIME OFFER!'}</h2>
              <p class="timer-popup-subtitle" style="
                font-size: 14px;
                margin: 0 0 25px 0;
                color: rgba(255, 255, 255, 0.85);
                line-height: 1.4;
                font-weight: 400;
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
                  backdrop-filter: blur(15px);
                  border: 1px solid rgba(255, 255, 255, 0.25);
                  border-radius: 16px;
                  padding: 12px 10px;
                  min-width: 60px;
                  position: relative;
                  overflow: hidden;
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2);
                ">
                  <div class="timer-number" style="
                    font-size: 28px;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0;
                    line-height: 1;
                    font-family: 'Courier New', monospace;
                    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
                    background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
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
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.25);
                border-radius: 16px;
                padding: 12px 10px;
                min-width: 60px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2);
              ">
                <div class="timer-number" style="
                  font-size: 28px;
                  font-weight: 700;
                  color: #ffffff;
                  margin: 0;
                  line-height: 1;
                  font-family: 'Courier New', monospace;
                  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
                  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
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
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.25);
                border-radius: 16px;
                padding: 12px 10px;
                min-width: 60px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2);
              ">
                <div class="timer-number" style="
                  font-size: 28px;
                  font-weight: 700;
                  color: #ffffff;
                  margin: 0;
                  line-height: 1;
                  font-family: 'Courier New', monospace;
                  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
                  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
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
                backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.25);
                border-radius: 16px;
                padding: 12px 10px;
                min-width: 60px;
                position: relative;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2);
              ">
                <div class="timer-number" style="
                  font-size: 28px;
                  font-weight: 700;
                  color: #ffffff;
                  margin: 0;
                  line-height: 1;
                  font-family: 'Courier New', monospace;
                  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
                  background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
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
            
            <div class="timer-form" style="margin: 25px 0 18px 0;">
              <input class="timer-email-input" type="email" placeholder="${config.placeholder || 'Enter your email to claim this offer'}" style="
                width: 100%;
                padding: 14px 18px;
                border: none;
                border-radius: 25px;
                font-size: 15px;
                box-sizing: border-box;
                background: rgba(255, 255, 255, 0.95);
                color: #333;
                margin-bottom: 18px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
              " readonly />
              <button class="timer-cta-button" style="
                width: 100%;
                padding: 16px 28px;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                border: none;
                border-radius: 25px;
                color: white;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                text-transform: uppercase;
                letter-spacing: 0.8px;
                position: relative;
                overflow: hidden;
                box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4), 0 4px 12px rgba(238, 90, 82, 0.3);
              ">
                ${config.buttonText || 'CLAIM OFFER NOW'}
              </button>
            </div>
            
            ${config.disclaimer ? `
              <div style="
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                margin-top: 15px;
              ">
                ${config.disclaimer}
              </div>
            ` : ''}
          </div>
        </div>
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
 * @param {object} config - Scratch card popup configuration
 * @returns {string} Complete HTML for scratch card popup
 */
function createScratchCardPopupContent(config) {
  // Generate random discount percentage (5%, 10%, 15%, 20%, 25%, 30%)
  const discountOptions = [5, 10, 15, 20, 25, 30];
  const randomDiscount = discountOptions[Math.floor(Math.random() * discountOptions.length)];
  
  // Responsive canvas size based on screen size - matching storefront implementation
  let canvasSize, discountFontSize, discountTextSize, containerWidth, containerHeight;
  if (typeof window !== 'undefined') {
    if (window.innerWidth <= 480) {
      canvasSize = 140;
      discountFontSize = '24px';
      discountTextSize = '12px';
      containerWidth = '98vw';
      containerHeight = 140;
    } else if (window.innerWidth <= 768) {
      canvasSize = 160;
      discountFontSize = '28px';
      discountTextSize = '14px';
      containerWidth = '95vw';
      containerHeight = 160;
    } else {
      canvasSize = 200;
      discountFontSize = '32px';
      discountTextSize = '16px';
      containerWidth = '700px';
      containerHeight = 200;
    }
  } else {
    // Default values for server-side rendering - increased for desktop
    canvasSize = 200;
    discountFontSize = '32px';
    discountTextSize = '16px';
    containerWidth = '700px';
    containerHeight = 200;
  }

  return `
    <div class="custom-popup scratch-card-popup" style="
      max-width: ${containerWidth};
      width: 90%;
      display: block;
      background: ${config.backgroundColor || '#ffffff'};
      border-radius: 20px;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      position: relative;
      border: none;
      min-height: auto;
    ">
      <div class="popup-content" style="
        display: block;
        min-height: auto;
        position: relative;
      ">
        <div class="scratch-card-content" style="
          display: block;
          width: 100%;
          padding: 0;
          position: relative;
        ">
          <div class="scratch-card-popup-inner" style="
            padding: 30px 25px 25px;
            position: relative;
          ">
            ${config.showCloseButton !== false ? `
              <button class="popup-close" style="
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.1);
                border: none;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                cursor: pointer;
                color: ${config.textColor || '#000000'};
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
                transition: all 0.3s ease;
              ">&times;</button>
            ` : ''}
            
            <div class="scratch-card-layout" style="
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 30px;
              padding: 0;
              width: 100%;
              justify-content: space-between;
            ">
              <div class="scratch-card-left" style="
                flex: 0 0 auto;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
              ">
                <div class="scratch-card-container" style="
                  position: relative;
                  width: ${canvasSize}px;
                  height: ${containerHeight}px;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
                  margin-bottom: 15px;
                  background: rgba(255, 255, 255, 0.9);
                  backdrop-filter: blur(10px);
                  border: 2px solid rgba(255, 255, 255, 0.8);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                ">
                  <div class="scratch-card-overlay" style="
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #4A90E2 0%, #5BA0F2 100%);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    position: relative;
                    cursor: pointer;
                    box-shadow: 0 8px 25px rgba(74, 144, 226, 0.3), 0 4px 12px rgba(91, 160, 242, 0.2);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                  ">
                    <div style="
                      font-size: 14px;
                      margin-bottom: 3px;
                      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                      letter-spacing: 1px;
                      font-weight: 700;
                    ">SCRATCH</div>
                    <div style="
                      font-size: 14px;
                      margin-bottom: 8px;
                      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                      letter-spacing: 1px;
                      font-weight: 700;
                    ">HERE</div>
                    <div style="
                      font-size: 20px;
                      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                    ">✋</div>
                    
                    <!-- Hidden discount content (partially visible in preview) -->
                    <div class="scratch-card-hidden" style="
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
                      border-radius: 12px;
                      border: 2px solid rgba(255, 255, 255, 0.2);
                      transition: all 0.3s ease;
                    ">
                      <div style="
                        font-size: ${discountFontSize};
                        font-weight: 800;
                        margin-bottom: 5px;
                        text-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
                        background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                      ">${randomDiscount}%</div>
                      <div style="
                        font-size: ${discountTextSize};
                        font-weight: 700;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
                        letter-spacing: 2px;
                      ">OFF</div>
                    </div>
                  </div>
                </div>
                <p style="
                  font-size: 14px;
                  color: ${config.textColor || '#000000'};
                  text-align: center;
                  margin: 0;
                  max-width: ${canvasSize}px;
                  line-height: 1.4;
                  font-weight: 500;
                ">Enter your email to start scratching!</p>
              </div>
              
              <div class="scratch-card-right" style="
                flex: 1;
                min-width: 0;
                max-width: none;
                padding-left: 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
              ">
                <h2 class="scratch-card-title" style="
                  font-size: 32px;
                  font-weight: 700;
                  margin: 0 0 15px 0;
                  color: ${config.textColor || '#000000'};
                  line-height: 1.2;
                  letter-spacing: -0.5px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  background-clip: text;
                ">${config.title || 'Scratch & Win!'}</h2>
                
                <p class="scratch-card-description" style="
                  font-size: 18px;
                  color: ${config.textColor || '#6c757d'};
                  margin: 0 0 25px 0;
                  line-height: 1.6;
                  font-weight: 400;
                ">${config.description || 'Scratch the card to reveal your exclusive discount and enter your email to claim it!'}</p>
                
                <div class="scratch-card-form">
                  <input class="scratch-card-email-input" type="email" placeholder="${config.placeholder || 'Enter your email'}" style="
                    width: 100%;
                    padding: 14px 18px;
                    border: 2px solid rgba(0, 0, 0, 0.1);
                    border-radius: 12px;
                    margin-bottom: 15px;
                    font-size: 15px;
                    box-sizing: border-box;
                    background: rgba(255, 255, 255, 0.8);
                    color: #333;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
                  " readonly />
                  
                  <label class="scratch-card-checkbox-label" style="
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                    font-size: 13px;
                    color: ${config.textColor || '#666666'};
                    cursor: pointer;
                    line-height: 1.4;
                  ">
                    <input type="checkbox" style="
                      margin-right: 10px;
                      transform: scale(1.1);
                    " />
                    <span>I agree to receive promotional emails and special offers</span>
                  </label>
                  
                  <button class="scratch-card-cta-button" style="
                    width: 100%;
                    background: linear-gradient(135deg, ${config.buttonColor || '#007ace'} 0%, ${config.buttonColor ? config.buttonColor + 'dd' : '#0056a3'} 100%);
                    border: none;
                    color: white;
                    padding: 16px 28px;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    font-size: 15px;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 6px 20px rgba(0, 122, 206, 0.3), 0 2px 8px rgba(0, 86, 163, 0.2);
                    position: relative;
                    overflow: hidden;
                  ">
                    ${config.buttonText || 'Enable Scratching'}
                  </button>
                </div>
              </div>
            </div>
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
    popup.style.boxSizing = 'border-box';
    
    // Ensure all child elements inherit box-sizing
    const allElements = popup.querySelectorAll('*');
    allElements.forEach(el => {
      el.style.boxSizing = 'border-box';
    });
    
    // Apply hover effects to close buttons
    const closeButtons = popup.querySelectorAll('.popup-close');
    closeButtons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
        button.style.opacity = '0.8';
      });
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.opacity = '1';
      });
    });
    
    // Apply type-specific enhancements
    if (type === 'wheel-email') {
      // Ensure wheel segments are properly positioned
      const wheelLabels = popup.querySelectorAll('.wheel-segment-label');
      wheelLabels.forEach(label => {
        label.style.pointerEvents = 'none';
        label.style.userSelect = 'none';
      });
      
      // Add wheel center pin styling
      const wheelCenter = popup.querySelector('.wheel-center');
      if (wheelCenter) {
        wheelCenter.style.cursor = 'pointer';
      }
    }
    
    if (type === 'timer') {
      // Enhance timer number styling
      const timerNumbers = popup.querySelectorAll('.timer-number');
      timerNumbers.forEach(number => {
        number.style.fontVariantNumeric = 'tabular-nums';
        number.style.fontFeatureSettings = '"tnum"';
      });
      
      // Add subtle animation to timer units
      const timerUnits = popup.querySelectorAll('.timer-unit');
      timerUnits.forEach((unit, index) => {
        unit.style.animationDelay = `${index * 0.1}s`;
      });
    }
    
    if (type === 'scratch-card') {
      // Enhance scratch card interactivity styling
      const scratchOverlay = popup.querySelector('.scratch-card-overlay');
      if (scratchOverlay) {
        scratchOverlay.style.userSelect = 'none';
        scratchOverlay.style.webkitUserSelect = 'none';
        scratchOverlay.style.mozUserSelect = 'none';
        scratchOverlay.style.msUserSelect = 'none';
      }
    }
    
    if (type === 'email') {
      // Enhance email popup button hover effects
      const emailButton = popup.querySelector('.email-popup-button');
      if (emailButton) {
        emailButton.addEventListener('mouseenter', () => {
          emailButton.style.transform = 'translateY(-2px)';
          emailButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        });
        emailButton.addEventListener('mouseleave', () => {
          emailButton.style.transform = 'translateY(0)';
          emailButton.style.boxShadow = 'none';
        });
      }
    }
    
    if (type === 'community') {
      // Enhance social icon hover effects
      const socialIcons = popup.querySelectorAll('.social-icon');
      socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
          icon.style.transform = 'scale(1.1) translateY(-2px)';
          icon.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        });
        icon.addEventListener('mouseleave', () => {
          icon.style.transform = 'scale(1) translateY(0)';
          icon.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });
      });
    }
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