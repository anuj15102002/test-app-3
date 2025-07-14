import { useState, useCallback, useEffect, useMemo } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  InlineStack,
  Select,
  TextField,
  RangeSlider,
  Checkbox,
  Badge,
  Divider,
  Icon,
  DataTable,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { EmailIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Load existing popup configuration if it exists
    let existingConfig = await db.popupConfig.findUnique({
      where: { shop: session.shop }
    });
    
    // If no configuration exists, create a default one
    if (!existingConfig) {
      existingConfig = await db.popupConfig.create({
        data: {
          shop: session.shop,
          type: "wheel-email",
          title: "GET YOUR CHANCE TO WIN",
          description: "Enter your email below and spin the wheel to see if you're our next lucky winner!",
          placeholder: "Your email",
          buttonText: "TRY YOUR LUCK",
          discountCode: "SAVE5",
          backgroundColor: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
          textColor: "#ffffff",
          buttonColor: "#ff6b6b",
          borderRadius: 8,
          showCloseButton: true,
          displayDelay: 3000,
          frequency: "once",
          exitIntent: false,
          exitIntentDelay: 1000,
          segments: JSON.stringify([
            { label: '5% DISCOUNT', color: '#ff6b6b', code: 'SAVE5' },
            { label: 'NO PRIZE', color: '#1e3c72', code: null },
            { label: 'UNLUCKY', color: '#4ecdc4', code: null },
            { label: '5% DISCOUNT', color: '#96ceb4', code: 'SAVE5' },
            { label: 'NO PRIZE', color: '#ff6b6b', code: null },
            { label: 'NEXT TIME', color: '#feca57', code: null }
          ]),
          isActive: true
        }
      });
    }
    
    return { existingConfig };
  } catch (error) {
    return { existingConfig: null };
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const popupConfigString = formData.get("popupConfig");
  
  if (!popupConfigString) {
    return { success: false, error: "No popup configuration provided" };
  }
  
  let popupData;
  try {
    popupData = JSON.parse(popupConfigString);
  } catch (error) {
    return { success: false, error: "Invalid popup configuration format" };
  }
  
  const { type, config } = popupData;
  
  if (!type || !config) {
    return { success: false, error: "Missing popup type or configuration" };
  }
  
  try {
    // Save popup configuration to database
    const savedConfig = await db.popupConfig.upsert({
      where: { shop: session.shop },
      update: {
        type,
        title: config.title,
        description: config.description,
        placeholder: config.placeholder || "",
        buttonText: config.buttonText,
        discountCode: config.discountCode || "",
        backgroundColor: config.backgroundColor,
        textColor: config.textColor,
        buttonColor: config.buttonColor || "#007ace",
        borderRadius: config.borderRadius || 8,
        showCloseButton: config.showCloseButton !== false,
        displayDelay: config.displayDelay || 3000,
        frequency: config.frequency || "once",
        exitIntent: config.exitIntent || false,
        exitIntentDelay: config.exitIntentDelay || 1000,
        segments: type === "wheel-email" ? JSON.stringify(config.segments) : null,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        shop: session.shop,
        type,
        title: config.title,
        description: config.description,
        placeholder: config.placeholder || "",
        buttonText: config.buttonText,
        discountCode: config.discountCode || "",
        backgroundColor: config.backgroundColor,
        textColor: config.textColor,
        buttonColor: config.buttonColor || "#007ace",
        borderRadius: config.borderRadius || 8,
        showCloseButton: config.showCloseButton !== false,
        displayDelay: config.displayDelay || 3000,
        frequency: config.frequency || "once",
        exitIntent: config.exitIntent || false,
        exitIntentDelay: config.exitIntentDelay || 1000,
        segments: type === "wheel-email" ? JSON.stringify(config.segments) : null,
        isActive: true
      }
    });
    
    return { success: true, config: savedConfig };
  } catch (error) {
    return { success: false, error: `Failed to save configuration: ${error.message}` };
  }
};

export default function PopupCustomizer() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const loaderData = useLoaderData();
  const existingConfig = loaderData?.existingConfig || null;
  
  // Initialize popup type from existing config or default to wheel-email
  const [popupType, setPopupType] = useState(existingConfig?.type || "wheel-email");
  
  // Email popup configuration
  const [emailConfig, setEmailConfig] = useState(() => {
    if (existingConfig && existingConfig.type === "email") {
      return {
        title: existingConfig.title,
        description: existingConfig.description,
        placeholder: existingConfig.placeholder,
        buttonText: existingConfig.buttonText,
        discountCode: existingConfig.discountCode,
        backgroundColor: existingConfig.backgroundColor,
        textColor: existingConfig.textColor,
        buttonColor: existingConfig.buttonColor,
        borderRadius: existingConfig.borderRadius,
        showCloseButton: existingConfig.showCloseButton,
        displayDelay: existingConfig.displayDelay,
        frequency: existingConfig.frequency || "once",
        exitIntent: existingConfig.exitIntent || false,
        exitIntentDelay: existingConfig.exitIntentDelay || 1000,
      };
    }
    return {
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
      displayDelay: 3000,
      frequency: "once",
      exitIntent: false,
      exitIntentDelay: 1000,
    };
  });
  

  // Wheel-Email combo configuration
  const [wheelEmailConfig, setWheelEmailConfig] = useState(() => {
    if (existingConfig && existingConfig.type === "wheel-email") {
      return {
        title: "GET YOUR CHANCE TO WIN",
        subtitle: "AMAZING DISCOUNTS!",
        description: "Enter your email below and spin the wheel to see if you're our next lucky winner!",
        placeholder: "Your email",
        buttonText: "TRY YOUR LUCK",
        discountCode: "SAVE5",
        segments: existingConfig.segments ? JSON.parse(existingConfig.segments) : [
          { label: '5% DISCOUNT', color: '#ff6b6b', code: 'SAVE5' },
          { label: 'NO PRIZE', color: '#1e3c72', code: null },
          { label: 'UNLUCKY', color: '#4ecdc4', code: null },
          { label: '5% DISCOUNT', color: '#96ceb4', code: 'SAVE5' },
          { label: 'NO PRIZE', color: '#ff6b6b', code: null },
          { label: 'NEXT TIME', color: '#feca57', code: null }
        ],
        backgroundColor: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
        textColor: "#ffffff",
        displayDelay: existingConfig.displayDelay || 3000,
        frequency: existingConfig.frequency || "once",
        exitIntent: existingConfig.exitIntent || false,
        exitIntentDelay: existingConfig.exitIntentDelay || 1000,
      };
    }
    return {
      title: "GET YOUR CHANCE TO WIN",
      subtitle: "AMAZING DISCOUNTS!",
      description: "Enter your email below and spin the wheel to see if you're our next lucky winner!",
      placeholder: "Your email",
      buttonText: "TRY YOUR LUCK",
      discountCode: "SAVE5",
      segments: [
        { label: '5% DISCOUNT', color: '#ff6b6b', code: 'SAVE5' },
        { label: 'NO PRIZE', color: '#1e3c72', code: null },
        { label: 'UNLUCKY', color: '#4ecdc4', code: null },
        { label: '5% DISCOUNT', color: '#96ceb4', code: 'SAVE5' },
        { label: 'NO PRIZE', color: '#ff6b6b', code: null },
        { label: 'NEXT TIME', color: '#feca57', code: null }
      ],
      backgroundColor: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
      textColor: "#ffffff",
      displayDelay: 3000,
      frequency: "once",
      exitIntent: false,
      exitIntentDelay: 1000,
    };
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleShowPreview = useCallback(() => {
    setIsPreviewMode(!isPreviewMode);
    
    if (!isPreviewMode) {
      // Show the popup overlay
      setTimeout(() => {
        const config = popupType === "email" ? emailConfig : wheelEmailConfig;
        showPopupOverlay(config);
      }, 100);
    } else {
      // Hide the popup overlay
      hidePopupOverlay();
    }
  }, [isPreviewMode, popupType, emailConfig, wheelEmailConfig]);

  const showPopupOverlay = (config) => {
    // Create popup overlay if it doesn't exist
    let overlay = document.getElementById('admin-popup-preview-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'admin-popup-preview-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div id="custom-popup-overlay" style="display: flex;">
        <div id="custom-popup" class="custom-popup">
          <div class="popup-content">
            <div class="wheel-section">
              <div class="popup-wheel-container">
                <!-- Wheel will be inserted here -->
              </div>
            </div>
            <div class="form-section">
              <button class="popup-close" onclick="window.hideAdminPopupPreview()">&times;</button>
              <div class="form-title">GET YOUR CHANCE TO WIN</div>
              <div class="form-subtitle">AMAZING DISCOUNTS!</div>
              <p class="form-description">Enter your email below and spin the wheel to see if you're our next lucky winner!</p>
              <div class="popup-form">
                <!-- Form content will be dynamically inserted here -->
              </div>
              <div class="house-rules">
                <h4>The House rules:</h4>
                <ul>
                  <li>Winnings through cheating will not be processed.</li>
                  <li>Only one spin allowed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        #admin-popup-preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
        }

        #custom-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        }

        .custom-popup {
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
          animation: popupSlideIn 0.3s ease-out;
          display: flex;
          align-items: center;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .popup-content {
          padding: 0;
          text-align: center;
          display: flex;
          width: 100%;
          min-height: 400px;
        }

        .wheel-section {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 0;
          overflow: hidden;
        }

        .form-section {
          flex: 1;
          padding: 40px 30px;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .form-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: white;
        }

        .form-subtitle {
          font-size: 16px;
          margin-bottom: 25px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.4;
        }

        .email-input {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 8px;
          margin-bottom: 15px;
          font-size: 16px;
          box-sizing: border-box;
        }

        .spin-button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .spin-button:hover {
          background: linear-gradient(135deg, #ee5a52 0%, #dc4c41 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(238, 90, 82, 0.4);
        }

        .house-rules {
          margin-top: 20px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          text-align: left;
        }

        .house-rules h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
        }

        .house-rules ul {
          margin: 0;
          padding-left: 15px;
          list-style-type: disc;
        }

        .house-rules li {
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .popup-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
          color: white;
        }

        .popup-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .form-description {
          font-size: 14px;
          margin-bottom: 25px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }

        .spinning-wheel {
          width: 300px;
          height: 300px;
          border-radius: 50%;
          border: 8px solid white;
          position: relative;
          transition: transform 0.5s ease-out;
          transform: translateX(-50%) rotate(0deg);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        }

        .wheel-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 4px solid #1e3c72;
          z-index: 5;
        }

        .wheel-pointer {
          position: absolute;
          top: 50%;
          right: -12px;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 12px solid transparent;
          border-bottom: 12px solid transparent;
          border-left: 20px solid white;
          z-index: 10;
        }

        .wheel-segment-label {
          font-family: Arial, sans-serif;
          user-select: none;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .custom-popup {
            max-width: 90vw;
            margin: 20px;
            flex-direction: column;
          }
          
          .popup-content {
            flex-direction: column;
            min-height: auto;
          }
          
          .wheel-section {
            order: 2;
            padding: 20px 0;
          }
          
          .form-section {
            order: 1;
            padding: 30px 20px 20px;
          }
          
          .spinning-wheel {
            width: 200px;
            height: 200px;
            transform: none;
            margin: 0 auto;
          }
          
          .form-title {
            font-size: 20px;
          }
          
          .form-subtitle {
            font-size: 14px;
          }
          
          .email-input {
            font-size: 16px;
          }
        }
      </style>
    `;

    // Configure the popup based on type
    const popup = overlay.querySelector('#custom-popup');
    const wheelContainer = overlay.querySelector('.popup-wheel-container');
    const formSection = overlay.querySelector('.form-section');

    if (popupType === 'email') {
      // Email popup configuration
      popup.style.background = config.backgroundColor || '#ffffff';
      popup.style.maxWidth = '400px';
      popup.style.display = 'block';
      
      const wheelSection = overlay.querySelector('.wheel-section');
      wheelSection.style.display = 'none';
      formSection.style.flex = 'none';
      formSection.style.width = '100%';
      formSection.style.padding = '24px';
      formSection.style.color = config.textColor || '#000000';
      
      formSection.innerHTML = `
        <button class="popup-close" onclick="window.hideAdminPopupPreview()" style="color: ${config.textColor || '#000000'};">&times;</button>
        <div style="text-align: center;">
          <div style="font-size: 24px; margin-bottom: 10px; color: ${config.textColor || '#000000'};">📧</div>
          <h3 style="font-size: 20px; font-weight: 600; margin: 0 0 15px 0; color: ${config.textColor || '#000000'};">
            ${config.title}
          </h3>
          <p style="margin-bottom: 20px; line-height: 1.5; color: ${config.textColor || '#000000'};">
            ${config.description}
          </p>
          <input type="email" id="popup-email" placeholder="${config.placeholder}" style="
            width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 6px;
            margin-bottom: 15px; font-size: 14px; box-sizing: border-box;
          " />
          <button onclick="window.handlePreviewEmailSubmit()" style="
            width: 100%; padding: 12px 24px; border: none; border-radius: 6px;
            font-weight: 600; cursor: pointer; font-size: 14px;
            background-color: ${config.buttonColor || '#007ace'}; color: white;
          ">
            ${config.buttonText}
          </button>
        </div>
      `;
    } else {
      // Wheel-email combo configuration
      popup.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
      popup.style.maxWidth = '600px';
      popup.style.display = 'flex';
      
      const wheelSection = overlay.querySelector('.wheel-section');
      wheelSection.style.display = 'flex';
      formSection.style.flex = '1';
      formSection.style.width = 'auto';
      formSection.style.padding = '40px 30px';
      formSection.style.color = 'white';
      
      formSection.innerHTML = `
        <button class="popup-close" onclick="window.hideAdminPopupPreview()">&times;</button>
        <div class="form-title">${config.title || 'GET YOUR CHANCE TO WIN'}</div>
        <div class="form-subtitle">${config.subtitle || 'AMAZING DISCOUNTS!'}</div>
        <p class="form-description">${config.description || 'Enter your email below and spin the wheel to see if you are our next lucky winner!'}</p>
        <div class="popup-form">
          <input type="email" class="email-input" id="popup-email" placeholder="${config.placeholder || 'Your email'}" />
          <button class="spin-button" onclick="window.handlePreviewEmailAndSpin()">
            ${config.buttonText || 'TRY YOUR LUCK'}
          </button>
        </div>
        <div class="house-rules">
          <h4>The House rules:</h4>
          <ul>
            <li>Winnings through cheating will not be processed.</li>
            <li>Only one spin allowed</li>
          </ul>
        </div>
      `;
      
      // Create wheel
      const segments = config.segments || [
        { label: '5% OFF', color: '#ff6b6b', value: '5' },
        { label: '10% OFF', color: '#4ecdc4', value: '10' },
        { label: '15% OFF', color: '#45b7d1', value: '15' },
        { label: '20% OFF', color: '#96ceb4', value: '20' },
        { label: 'FREE SHIPPING', color: '#feca57', value: 'shipping' },
        { label: 'TRY AGAIN', color: '#1e3c72', value: null }
      ];
      
      const angle = 360 / segments.length;
      const gradient = segments.map((s, i) => `${s.color} ${i * angle}deg ${(i + 1) * angle}deg`).join(', ');
      
      const segmentLabels = segments.map((segment, index) => {
        const segmentAngle = (360 / segments.length) * index + (360 / segments.length) / 2;
        const radius = 80; // Reduced radius to keep text within wheel boundaries
        const x = Math.cos((segmentAngle - 90) * Math.PI / 180) * radius;
        const y = Math.sin((segmentAngle - 90) * Math.PI / 180) * radius;
        
        return `
          <div class="wheel-segment-label" style="
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%) translate(${x}px, ${y}px);
            font-size: 11px;
            font-weight: bold;
            color: white;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            pointer-events: none;
            text-align: center;
            line-height: 1.1;
            max-width: 60px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 20px;
          ">
            ${segment.label}
          </div>
        `;
      }).join('');
      
      wheelContainer.innerHTML = `
        <div class="spinning-wheel" id="spinning-wheel" style="background: conic-gradient(${gradient}); position: relative;">
          <div class="wheel-pointer"></div>
          <div class="wheel-center"></div>
          ${segmentLabels}
        </div>
      `;
    }

    // Add global functions for preview
    window.hideAdminPopupPreview = () => {
      const overlay = document.getElementById('admin-popup-preview-overlay');
      if (overlay) {
        overlay.remove();
      }
      setIsPreviewMode(false);
    };

    window.handlePreviewEmailSubmit = () => {
      const email = overlay.querySelector('#popup-email')?.value;
      if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        return;
      }
      alert('🎉 Preview Mode: Email submitted successfully!\n\nIn live mode, this would generate a real discount code.');
      window.hideAdminPopupPreview();
    };

    window.handlePreviewEmailAndSpin = () => {
      const email = overlay.querySelector('#popup-email')?.value;
      if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        return;
      }
      
      const segments = config.segments || [
        { label: '5% OFF', color: '#ff6b6b', value: '5' },
        { label: '10% OFF', color: '#4ecdc4', value: '10' },
        { label: '15% OFF', color: '#45b7d1', value: '15' },
        { label: '20% OFF', color: '#96ceb4', value: '20' },
        { label: 'FREE SHIPPING', color: '#feca57', value: 'shipping' },
        { label: 'TRY AGAIN', color: '#1e3c72', value: null }
      ];
      
      const prizeIndex = Math.floor(Math.random() * segments.length);
      const prize = segments[prizeIndex];
      
      const wheel = overlay.querySelector('#spinning-wheel');
      const button = overlay.querySelector('.spin-button');
      
      button.disabled = true;
      button.textContent = 'SPINNING...';
      
      const segmentAngle = 360 / segments.length;
      const targetAngle = (prizeIndex * segmentAngle) + (segmentAngle / 2);
      const fullRotations = 3 + Math.random() * 2;
      const finalRotation = (fullRotations * 360) + (360 - targetAngle);
      
      wheel.style.transition = 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1)';
      wheel.style.transform = `translateX(-50%) rotate(${finalRotation}deg)`;
      
      setTimeout(() => {
        const isWinner = prize.value || prize.label.toLowerCase().includes('off') || prize.label.toLowerCase().includes('shipping');
        
        if (isWinner) {
          alert(`🎉 Congratulations! You won: ${prize.label}!\n\nIn live mode, this would generate a real discount code.`);
        } else {
          alert(`😔 ${prize.label}\n\nBetter luck next time!`);
        }
        window.hideAdminPopupPreview();
      }, 3000);
    };

    // Click outside to close
    overlay.addEventListener('click', (e) => {
      if (e.target.id === 'custom-popup-overlay') {
        window.hideAdminPopupPreview();
      }
    });
  };

  const hidePopupOverlay = () => {
    const overlay = document.getElementById('admin-popup-preview-overlay');
    if (overlay) {
      overlay.remove();
    }
  };


  const handleSaveConfig = useCallback(() => {
    const config = popupType === "email" ? emailConfig : wheelEmailConfig;
    
    fetcher.submit(
      { popupConfig: JSON.stringify({ type: popupType, config }) },
      { method: "POST" }
    );
  }, [popupType, emailConfig, wheelEmailConfig, fetcher]);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        shopify.toast.show("Popup configuration saved successfully!");
      } else if (fetcher.data.error) {
        shopify.toast.show(`Error: ${fetcher.data.error}`, { isError: true });
      }
    }
  }, [fetcher.data, shopify]);

  const popupTypeOptions = [
    { label: "Email Discount Popup", value: "email" },
    { label: "Wheel + Email Combo", value: "wheel-email" },
  ];


  const renderEmailConfig = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">Email Popup Configuration</Text>
      
      <TextField
        label="Popup Title"
        value={emailConfig.title}
        onChange={(value) => setEmailConfig({ ...emailConfig, title: value })}
        placeholder="Enter popup title"
      />
      
      <TextField
        label="Description"
        value={emailConfig.description}
        onChange={(value) => setEmailConfig({ ...emailConfig, description: value })}
        multiline={3}
        placeholder="Enter popup description"
      />
      
      <TextField
        label="Email Placeholder"
        value={emailConfig.placeholder}
        onChange={(value) => setEmailConfig({ ...emailConfig, placeholder: value })}
        placeholder="Email input placeholder"
      />
      
      <TextField
        label="Button Text"
        value={emailConfig.buttonText}
        onChange={(value) => setEmailConfig({ ...emailConfig, buttonText: value })}
        placeholder="Button text"
      />
      
      <TextField
        label="Discount Code"
        value={emailConfig.discountCode}
        onChange={(value) => setEmailConfig({ ...emailConfig, discountCode: value })}
        placeholder="Discount code to offer"
      />
      
      <InlineStack gap="400">
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Background Color</Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <input
              type="color"
              value={emailConfig.backgroundColor}
              onChange={(e) => setEmailConfig({ ...emailConfig, backgroundColor: e.target.value })}
              style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
          </Box>
        </Box>
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Text Color</Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <input
              type="color"
              value={emailConfig.textColor}
              onChange={(e) => setEmailConfig({ ...emailConfig, textColor: e.target.value })}
              style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
          </Box>
        </Box>
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Button Color</Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <input
              type="color"
              value={emailConfig.buttonColor}
              onChange={(e) => setEmailConfig({ ...emailConfig, buttonColor: e.target.value })}
              style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
          </Box>
        </Box>
      </InlineStack>
      
      <RangeSlider
        label={`Border Radius: ${emailConfig.borderRadius}px`}
        value={emailConfig.borderRadius}
        onChange={(value) => setEmailConfig({ ...emailConfig, borderRadius: value })}
        min={0}
        max={20}
        step={1}
      />
      
      <RangeSlider
        label={`Display Delay: ${emailConfig.displayDelay / 1000}s`}
        value={emailConfig.displayDelay}
        onChange={(value) => setEmailConfig({ ...emailConfig, displayDelay: value })}
        min={0}
        max={10000}
        step={500}
      />
      
      <Checkbox
        label="Show close button"
        checked={emailConfig.showCloseButton}
        onChange={(checked) => setEmailConfig({ ...emailConfig, showCloseButton: checked })}
      />
      
      <Divider />
      
      <Text as="h4" variant="headingSm">Advanced Settings</Text>
      
      <Select
        label="Display Frequency"
        options={[
          { label: "Show once per visitor", value: "once" },
          { label: "Show once per day", value: "daily" },
          { label: "Show once per week", value: "weekly" },
          { label: "Show on every visit", value: "always" },
        ]}
        value={emailConfig.frequency}
        onChange={(value) => setEmailConfig({ ...emailConfig, frequency: value })}
        helpText="Control how often the popup appears to the same visitor"
      />
      
      <Checkbox
        label="Enable exit intent detection"
        checked={emailConfig.exitIntent}
        onChange={(checked) => setEmailConfig({ ...emailConfig, exitIntent: checked })}
        helpText="Show popup when user is about to leave the page"
      />
      
      {emailConfig.exitIntent && (
        <RangeSlider
          label={`Exit intent delay: ${emailConfig.exitIntentDelay}ms`}
          value={emailConfig.exitIntentDelay}
          onChange={(value) => setEmailConfig({ ...emailConfig, exitIntentDelay: value })}
          min={500}
          max={3000}
          step={100}
          helpText="Delay before exit intent triggers"
        />
      )}
    </BlockStack>
  );


  const renderWheelEmailConfig = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">Wheel + Email Combo Configuration</Text>
      
      <TextField
        label="Main Title"
        value={wheelEmailConfig.title}
        onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, title: value })}
        placeholder="Main title (e.g., GET YOUR CHANCE TO WIN)"
      />
      
      <TextField
        label="Subtitle"
        value={wheelEmailConfig.subtitle}
        onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, subtitle: value })}
        placeholder="Subtitle (e.g., AMAZING DISCOUNTS!)"
      />
      
      <TextField
        label="Description"
        value={wheelEmailConfig.description}
        onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, description: value })}
        multiline={3}
        placeholder="Description text"
      />
      
      <TextField
        label="Email Placeholder"
        value={wheelEmailConfig.placeholder}
        onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, placeholder: value })}
        placeholder="Email input placeholder"
      />
      
      <TextField
        label="Button Text"
        value={wheelEmailConfig.buttonText}
        onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, buttonText: value })}
        placeholder="Button text (e.g., TRY YOUR LUCK)"
      />
      
      <TextField
        label="Default Discount Code"
        value={wheelEmailConfig.discountCode}
        onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, discountCode: value })}
        placeholder="Default discount code for winners"
      />
      
      <Text as="h4" variant="headingSm">Wheel Segments</Text>
      <BlockStack gap="200">
        {wheelEmailConfig.segments.map((segment, index) => (
          <InlineStack key={index} gap="200" align="center">
            <Box minWidth="120px">
              <TextField
                value={segment.label}
                onChange={(value) => {
                  const newSegments = [...wheelEmailConfig.segments];
                  newSegments[index].label = value;
                  setWheelEmailConfig({ ...wheelEmailConfig, segments: newSegments });
                }}
                placeholder="Segment text"
              />
            </Box>
            <Box minWidth="60px">
              <input
                type="color"
                value={segment.color}
                onChange={(e) => {
                  const newSegments = [...wheelEmailConfig.segments];
                  newSegments[index].color = e.target.value;
                  setWheelEmailConfig({ ...wheelEmailConfig, segments: newSegments });
                }}
                style={{ width: "40px", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
              />
            </Box>
            <Box minWidth="100px">
              <TextField
                value={segment.code || ''}
                onChange={(value) => {
                  const newSegments = [...wheelEmailConfig.segments];
                  newSegments[index].code = value || null;
                  setWheelEmailConfig({ ...wheelEmailConfig, segments: newSegments });
                }}
                placeholder="Discount code"
              />
            </Box>
          </InlineStack>
        ))}
      </BlockStack>
      
      <RangeSlider
        label={`Display Delay: ${wheelEmailConfig.displayDelay / 1000}s`}
        value={wheelEmailConfig.displayDelay}
        onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, displayDelay: value })}
        min={0}
        max={10000}
        step={500}
      />
      
      <Divider />
      
      <Text as="h4" variant="headingSm">Advanced Settings</Text>
      
      <Select
        label="Display Frequency"
        options={[
          { label: "Show once per visitor", value: "once" },
          { label: "Show once per day", value: "daily" },
          { label: "Show once per week", value: "weekly" },
          { label: "Show on every visit", value: "always" },
        ]}
        value={wheelEmailConfig.frequency}
        onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, frequency: value })}
        helpText="Control how often the popup appears to the same visitor"
      />
      
      <Checkbox
        label="Enable exit intent detection"
        checked={wheelEmailConfig.exitIntent}
        onChange={(checked) => setWheelEmailConfig({ ...wheelEmailConfig, exitIntent: checked })}
        helpText="Show popup when user is about to leave the page"
      />
      
      {wheelEmailConfig.exitIntent && (
        <RangeSlider
          label={`Exit intent delay: ${wheelEmailConfig.exitIntentDelay}ms`}
          value={wheelEmailConfig.exitIntentDelay}
          onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, exitIntentDelay: value })}
          min={500}
          max={3000}
          step={100}
          helpText="Delay before exit intent triggers"
        />
      )}
    </BlockStack>
  );

  const renderPreview = () => {
    const config = popupType === "email" ? emailConfig : wheelEmailConfig;
    const badgeText = popupType === "email" ? "Email Popup" : "Wheel + Email Combo";
    
    return (
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="h3" variant="headingMd">Preview</Text>
            <Badge tone="info">{badgeText}</Badge>
          </InlineStack>
          
          <Box
            padding="400"
            background="bg-surface-secondary"
            borderRadius="200"
            borderWidth="025"
            borderColor="border"
          >
            <div
              style={{
                backgroundColor: popupType === "wheel-email" ? "transparent" : config.backgroundColor,
                color: config.textColor,
                padding: popupType === "wheel-email" ? "0" : "24px",
                borderRadius: `${popupType === "email" ? emailConfig.borderRadius : 8}px`,
                textAlign: "center",
                maxWidth: "400px",
                margin: "0 auto",
                boxShadow: popupType === "wheel-email" ? "none" : "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <BlockStack gap="300">
                {popupType !== "wheel-email" && (
                  <>
                    <InlineStack align="center" gap="200">
                      {popupType === "email" ? (
                        <Icon source={EmailIcon} />
                      ) : (
                        <Text as="span" variant="headingLg">🎡</Text>
                      )}
                      <Text as="h4" variant="headingMd" style={{ color: config.textColor }}>
                        {config.title}
                      </Text>
                    </InlineStack>
                    
                    <Text as="p" variant="bodyMd" style={{ color: config.textColor }}>
                      {config.description}
                    </Text>
                  </>
                )}
                
                {popupType === "email" ? (
                  <BlockStack gap="200">
                    <div
                      style={{
                        padding: "8px 12px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        backgroundColor: "#fff",
                        color: "#666",
                      }}
                    >
                      {emailConfig.placeholder}
                    </div>
                    <button
                      style={{
                        backgroundColor: emailConfig.buttonColor,
                        color: "#fff",
                        padding: "12px 24px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      {emailConfig.buttonText}
                    </button>
                  </BlockStack>
                ) : (
                  // Wheel-Email Combo Preview - Same size as others
                  <div
                    style={{
                      background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative",
                      padding: "16px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        minHeight: "200px",
                      }}
                    >
                      {/* Wheel Section */}
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          paddingRight: 0,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: "120px",
                            height: "120px",
                            borderRadius: "50%",
                            border: "4px solid white",
                            position: "relative",
                            transform: "translateX(-50%)",
                            background: `conic-gradient(${wheelEmailConfig.segments.map((segment, index) =>
                              `${segment.color} ${index * (360 / wheelEmailConfig.segments.length)}deg ${(index + 1) * (360 / wheelEmailConfig.segments.length)}deg`
                            ).join(", ")})`,
                            boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          {/* Wheel pointer */}
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              right: "-6px",
                              transform: "translateY(-50%)",
                              width: 0,
                              height: 0,
                              borderTop: "6px solid transparent",
                              borderBottom: "6px solid transparent",
                              borderLeft: "10px solid white",
                              zIndex: 10,
                            }}
                          />
                          {/* Wheel center */}
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              backgroundColor: "white",
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              border: "2px solid #1e3c72",
                              zIndex: 5,
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Form Section */}
                      <div
                        style={{
                          flex: 1,
                          padding: "10px 15px",
                          color: "white",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px", color: "white" }}>
                          {wheelEmailConfig.title}
                        </div>
                        <div style={{ fontSize: "10px", marginBottom: "8px", color: "rgba(255, 255, 255, 0.9)" }}>
                          {wheelEmailConfig.subtitle}
                        </div>
                        <div style={{ fontSize: "8px", marginBottom: "10px", color: "rgba(255, 255, 255, 0.8)", lineHeight: "1.2" }}>
                          Enter email & spin to win!
                        </div>
                        
                        <div
                          style={{
                            padding: "6px",
                            border: "none",
                            borderRadius: "4px",
                            backgroundColor: "#fff",
                            color: "#666",
                            marginBottom: "6px",
                            fontSize: "8px",
                          }}
                        >
                          {wheelEmailConfig.placeholder}
                        </div>
                        
                        <button
                          style={{
                            width: "100%",
                            padding: "6px",
                            background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
                            border: "none",
                            borderRadius: "4px",
                            color: "white",
                            fontSize: "8px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {wheelEmailConfig.buttonText}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </BlockStack>
            </div>
          </Box>
        </BlockStack>
      </Card>
    );
  };

  return (
    <Page>
      <TitleBar title="Popup Customizer">
        <Button variant="primary" onClick={handleSaveConfig}>
          Save Configuration
        </Button>
      </TitleBar>
      
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Popup Configuration
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Customize your popup to engage visitors and boost conversions. Choose between email capture or spinning wheel discount popups.
                  </Text>
                </BlockStack>
                
                <Divider />
                
                
                <Select
                  label="Popup Type"
                  options={popupTypeOptions}
                  value={popupType}
                  onChange={setPopupType}
                />
                
                <Divider />
                
                {popupType === "email" ? renderEmailConfig() : renderWheelEmailConfig()}
                
                <InlineStack gap="300">
                  <Button onClick={handleSaveConfig} variant="primary">
                    Save Configuration
                  </Button>
                  <Button onClick={handleShowPreview}>
                    {isPreviewMode ? "Hide Preview" : "Show Preview"}
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              {renderPreview()}
              
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Quick Tips
                  </Text>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">
                      • Keep your popup title short and compelling
                    </Text>
                    <Text as="p" variant="bodyMd">
                      • Test different delay times to find optimal engagement
                    </Text>
                    <Text as="p" variant="bodyMd">
                      • Use contrasting colors for better visibility
                    </Text>
                    <Text as="p" variant="bodyMd">
                      • Configure discount codes in the wheel segments
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
