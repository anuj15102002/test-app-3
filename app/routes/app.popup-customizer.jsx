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
  Modal,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { EmailIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import PopupPreview from "../components/PopupPreview";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const popupId = url.searchParams.get("id");
  
  try {
    let existingConfig = null;
    
    // If popupId is provided, load that specific popup
    if (popupId) {
      existingConfig = await db.popupConfig.findFirst({
        where: {
          id: popupId,
          shop: session.shop
        }
      });
    }
    
    // Check app embed status - simplified check
    let appEmbedEnabled = true; // Assume enabled for new popup management system
    
    return { existingConfig, appEmbedEnabled, popupId };
  } catch (error) {
    return { existingConfig: null, appEmbedEnabled: false, popupId: null };
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const popupConfigString = formData.get("popupConfig");
  const popupId = formData.get("popupId");
  
  if (!popupConfigString) {
    return { success: false, error: "No popup configuration provided" };
  }
  
  let popupData;
  try {
    popupData = JSON.parse(popupConfigString);
  } catch (error) {
    return { success: false, error: "Invalid popup configuration format" };
  }
  
  const { type, config, name, pageTargeting } = popupData;
  
  if (!type || !config) {
    return { success: false, error: "Missing popup type or configuration" };
  }
  
  // Debug logging for scratch card
  if (type === "scratch-card") {
    console.log("=== SCRATCH CARD DEBUG ===");
    console.log("Type:", type);
    console.log("Config received:", config);
    console.log("PopupId:", popupId);
    console.log("Config keys:", Object.keys(config));
    console.log("Exit Intent:", config.exitIntent);
    console.log("Frequency:", config.frequency);
    console.log("=========================");
  }
  
  // Validate scratch card configuration
  if (type === "scratch-card") {
      const requiredFields = ['title', 'description', 'placeholder', 'buttonText', 'backgroundColor', 'textColor'];
      const missingFields = requiredFields.filter(field => !config[field]);
      if (missingFields.length > 0) {
        console.log("Missing required fields for scratch card:", missingFields);
        return { success: false, error: `Missing required fields for scratch card: ${missingFields.join(', ')}` };
      }
    }
    
    // Generate a default name if not provided
    const popupName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} Popup - ${new Date().toLocaleDateString()}`;
  
  try {
    let savedConfig;
    
    if (popupId) {
      // Update existing popup
      if (type === "scratch-card") {
        console.log("=== UPDATING SCRATCH CARD ===");
        console.log("PopupId:", popupId);
        console.log("Shop:", session.shop);
      }
      
      savedConfig = await db.popupConfig.update({
        where: {
          id: popupId,
          shop: session.shop
        },
        data: {
          name: popupName,
          type,
          title: config.title,
          description: config.description,
          placeholder: config.placeholder || "",
          buttonText: config.buttonText || (type === "community" ? "Follow Us" : ""),
          discountCode: config.discountCode || "",
          backgroundColor: config.backgroundColor,
          textColor: config.textColor,
          buttonColor: config.buttonColor || "#007ace",
          borderRadius: config.borderRadius || 20,
          showCloseButton: config.showCloseButton !== false,
          displayDelay: config.displayDelay || 3000,
          frequency: config.frequency ?? "once",
          exitIntent: config.exitIntent ?? false,
          exitIntentDelay: config.exitIntentDelay || 1000,
          segments: type === "wheel-email" ? JSON.stringify(config.segments) : null,
          backgroundType: config.backgroundType || null,
          bannerImage: type === "community" ? config.bannerImage || null : null,
          socialIcons: type === "community" ? JSON.stringify(config.socialIcons) : null,
          askMeLaterText: type === "community" ? config.askMeLaterText || null : null,
          showAskMeLater: type === "community" ? config.showAskMeLater !== false : true,
          // Timer popup specific fields
          timerDays: type === "timer" ? config.timerDays || 0 : null,
          timerHours: type === "timer" ? config.timerHours || 0 : null,
          timerMinutes: type === "timer" ? config.timerMinutes || 5 : null,
          timerSeconds: type === "timer" ? config.timerSeconds || 0 : null,
          timerIcon: type === "timer" ? config.timerIcon || "⏰" : null,
          onExpiration: type === "timer" ? config.onExpiration || "show_expired" : null,
          expiredTitle: type === "timer" ? config.expiredTitle || "OFFER EXPIRED" : null,
          expiredMessage: type === "timer" ? config.expiredMessage || null : null,
          expiredIcon: type === "timer" ? config.expiredIcon || "⏰" : null,
          expiredButtonText: type === "timer" ? config.expiredButtonText || "CONTINUE SHOPPING" : null,
          successTitle: type === "timer" ? config.successTitle || "SUCCESS!" : null,
          successMessage: type === "timer" ? config.successMessage || null : null,
          disclaimer: type === "timer" ? config.disclaimer || null : null,
          // Page targeting fields
          pageTargeting: pageTargeting?.selectedPages ? JSON.stringify(pageTargeting.selectedPages) : null,
          targetAllPages: pageTargeting?.targetAllPages ?? true,
          targetSpecificPages: pageTargeting?.targetSpecificPages ?? false,
          updatedAt: new Date()
        }
      });
      
      if (type === "scratch-card") {
        console.log("=== SCRATCH CARD UPDATED ===");
        console.log("Updated config:", savedConfig);
      }
    } else {
      // Create new popup
      if (type === "scratch-card") {
        console.log("=== CREATING NEW SCRATCH CARD ===");
      }
      
      savedConfig = await db.popupConfig.create({
        data: {
          shop: session.shop,
          name: popupName,
          type,
          title: config.title,
          description: config.description,
          placeholder: config.placeholder || "",
          buttonText: config.buttonText || (type === "community" ? "Follow Us" : ""),
          discountCode: config.discountCode || "",
          backgroundColor: config.backgroundColor,
          textColor: config.textColor,
          buttonColor: config.buttonColor || "#007ace",
          borderRadius: config.borderRadius || 20,
          showCloseButton: config.showCloseButton !== false,
          displayDelay: config.displayDelay || 3000,
          frequency: config.frequency ?? "once",
          exitIntent: config.exitIntent ?? false,
          exitIntentDelay: config.exitIntentDelay || 1000,
          segments: type === "wheel-email" ? JSON.stringify(config.segments) : null,
          backgroundType: config.backgroundType || null,
          bannerImage: type === "community" ? config.bannerImage || null : null,
          socialIcons: type === "community" ? JSON.stringify(config.socialIcons) : null,
          askMeLaterText: type === "community" ? config.askMeLaterText || null : null,
          showAskMeLater: type === "community" ? config.showAskMeLater !== false : true,
          // Timer popup specific fields
          timerDays: type === "timer" ? config.timerDays || 0 : null,
          timerHours: type === "timer" ? config.timerHours || 0 : null,
          timerMinutes: type === "timer" ? config.timerMinutes || 5 : null,
          timerSeconds: type === "timer" ? config.timerSeconds || 0 : null,
          timerIcon: type === "timer" ? config.timerIcon || "⏰" : null,
          onExpiration: type === "timer" ? config.onExpiration || "show_expired" : null,
          expiredTitle: type === "timer" ? config.expiredTitle || "OFFER EXPIRED" : null,
          expiredMessage: type === "timer" ? config.expiredMessage || null : null,
          expiredIcon: type === "timer" ? config.expiredIcon || "⏰" : null,
          expiredButtonText: type === "timer" ? config.expiredButtonText || "CONTINUE SHOPPING" : null,
          successTitle: type === "timer" ? config.successTitle || "SUCCESS!" : null,
          successMessage: type === "timer" ? config.successMessage || null : null,
          disclaimer: type === "timer" ? config.disclaimer || null : null,
          // Page targeting fields
          pageTargeting: pageTargeting?.selectedPages ? JSON.stringify(pageTargeting.selectedPages) : null,
          targetAllPages: pageTargeting?.targetAllPages ?? true,
          targetSpecificPages: pageTargeting?.targetSpecificPages ?? false,
          isActive: false // New popups start as inactive
        }
      });
      
      if (type === "scratch-card") {
        console.log("=== SCRATCH CARD CREATED ===");
        console.log("Created config:", savedConfig);
      }
    }
    
    if (type === "scratch-card") {
      console.log("=== FINAL RESULT ===");
      console.log("Success: true");
      console.log("Config ID:", savedConfig.id);
    }
    
    return {
      success: true,
      config: savedConfig,
      message: popupId ? "Popup updated successfully!" : "Popup created successfully!"
    };
  } catch (error) {
    if (type === "scratch-card") {
      console.log("=== SCRATCH CARD ERROR ===");
      console.log("Error:", error);
      console.log("Error message:", error.message);
      console.log("Error stack:", error.stack);
    }
    return { success: false, error: `Failed to save configuration: ${error.message}` };
  }
};

export default function PopupCustomizer() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const loaderData = useLoaderData();
  const existingConfig = loaderData?.existingConfig || null;
  const appEmbedEnabled = loaderData?.appEmbedEnabled || false;
  const popupId = loaderData?.popupId || null;
  
  // Initialize popup type from existing config or default to wheel-email
  const [popupType, setPopupType] = useState(existingConfig?.type || "wheel-email");
  
  // Popup name state
  const [popupName, setPopupName] = useState(existingConfig?.name || "");
  
  // State for realtime preview
  const [showRealtimePreview, setShowRealtimePreview] = useState(false);
  
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
        frequency: existingConfig.frequency ?? "once",
        exitIntent: existingConfig.exitIntent ?? false,
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
      const backgroundColor = existingConfig.backgroundColor || "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)";
      let backgroundType = "gradient";
      
      // Determine background type from existing backgroundColor
      if (backgroundColor.includes("linear-gradient") || backgroundColor.includes("radial-gradient")) {
        backgroundType = "gradient";
      } else if (backgroundColor.startsWith("#") || backgroundColor.startsWith("rgb") || backgroundColor.startsWith("hsl")) {
        backgroundType = "solid";
      } else {
        backgroundType = "custom";
      }
      
      return {
        title: existingConfig.title || "GET YOUR CHANCE TO WIN",
        subtitle: "AMAZING DISCOUNTS!",
        description: existingConfig.description || "Enter your email below and spin the wheel to see if you're our next lucky winner!",
        placeholder: existingConfig.placeholder || "Your email",
        buttonText: existingConfig.buttonText || "TRY YOUR LUCK",
        discountCode: existingConfig.discountCode || "SAVE5",
        segments: existingConfig.segments ? JSON.parse(existingConfig.segments) : [
          { label: '5% OFF', color: '#ef4444', code: 'SAVE5' },
          { label: '10% OFF', color: '#06b6d4', code: 'SAVE10' },
          { label: '15% OFF', color: '#10b981', code: 'SAVE15' },
          { label: '20% OFF', color: '#f59e0b', code: 'SAVE20' },
          { label: 'FREE SHIPPING', color: '#ff9ff3', code: 'FREESHIP' },
          { label: 'TRY AGAIN', color: '#54a0ff', code: null }
        ],
        backgroundColor: backgroundColor,
        backgroundType: backgroundType,
        textColor: "#ffffff",
        displayDelay: existingConfig.displayDelay || 3000,
        frequency: existingConfig.frequency ?? "once",
        exitIntent: existingConfig.exitIntent ?? false,
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
        { label: '5% OFF', color: '#ff6b6b', code: 'SAVE5' },
        { label: '10% OFF', color: '#4ecdc4', code: 'SAVE10' },
        { label: '15% OFF', color: '#45b7d1', code: 'SAVE15' },
        { label: '20% OFF', color: '#feca57', code: 'SAVE20' },
        { label: 'FREE SHIPPING', color: '#ff9ff3', code: 'FREESHIP' },
        { label: 'TRY AGAIN', color: '#54a0ff', code: null }
      ],
      backgroundColor: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
      backgroundType: "gradient",
      textColor: "#ffffff",
      displayDelay: 3000,
      frequency: "once",
      exitIntent: false,
      exitIntentDelay: 1000,
    };
  });

  // Community popup configuration
  const [communityConfig, setCommunityConfig] = useState(() => {
    if (existingConfig && existingConfig.type === "community") {
      return {
        title: existingConfig.title || "JOIN OUR COMMUNITY",
        description: existingConfig.description || "Connect with us on social media and stay updated with our latest news and offers!",
        buttonText: existingConfig.buttonText || "Follow Us",
        bannerImage: existingConfig.bannerImage || "",
        socialIcons: existingConfig.socialIcons ? JSON.parse(existingConfig.socialIcons) : [
          { platform: 'facebook', url: '', enabled: true },
          { platform: 'instagram', url: '', enabled: true },
          { platform: 'linkedin', url: '', enabled: true },
          { platform: 'x', url: '', enabled: true }
        ],
        askMeLaterText: existingConfig.askMeLaterText || "Ask me later",
        showAskMeLater: existingConfig.showAskMeLater !== false,
        backgroundColor: existingConfig.backgroundColor || "#ffffff",
        textColor: existingConfig.textColor || "#000000",
        borderRadius: existingConfig.borderRadius || 12,
        showCloseButton: existingConfig.showCloseButton !== false,
        displayDelay: existingConfig.displayDelay || 3000,
        frequency: existingConfig.frequency ?? "once",
        exitIntent: existingConfig.exitIntent ?? false,
        exitIntentDelay: existingConfig.exitIntentDelay || 1000,
      };
    }
    return {
      title: "JOIN OUR COMMUNITY",
      description: "Connect with us on social media and stay updated with our latest news and offers!",
      buttonText: "Follow Us",
      bannerImage: "",
      socialIcons: [
        { platform: 'facebook', url: '', enabled: true },
        { platform: 'instagram', url: '', enabled: true },
        { platform: 'linkedin', url: '', enabled: true },
        { platform: 'x', url: '', enabled: true }
      ],
      askMeLaterText: "Ask me later",
      showAskMeLater: true,
      backgroundColor: "#ffffff",
      textColor: "#000000",
      borderRadius: 12,
      showCloseButton: true,
      displayDelay: 3000,
      frequency: "once",
      exitIntent: false,
      exitIntentDelay: 1000,
    };
  });

  // Timer popup configuration
  const [timerConfig, setTimerConfig] = useState(() => {
    if (existingConfig && existingConfig.type === "timer") {
      return {
        title: existingConfig.title || "LIMITED TIME OFFER!",
        description: existingConfig.description || "Don't miss out on this exclusive deal. Time is running out!",
        placeholder: existingConfig.placeholder || "Enter your email to claim this offer",
        buttonText: existingConfig.buttonText || "CLAIM OFFER NOW",
        discountCode: existingConfig.discountCode || "TIMER10",
        backgroundColor: existingConfig.backgroundColor || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        textColor: existingConfig.textColor || "#ffffff",
        borderRadius: existingConfig.borderRadius || 16,
        showCloseButton: existingConfig.showCloseButton !== false,
        displayDelay: existingConfig.displayDelay || 3000,
        frequency: existingConfig.frequency ?? "once",
        exitIntent: existingConfig.exitIntent ?? false,
        exitIntentDelay: existingConfig.exitIntentDelay || 1000,
        timerDays: existingConfig.timerDays || 0,
        timerHours: existingConfig.timerHours || 0,
        timerMinutes: existingConfig.timerMinutes || 5,
        timerSeconds: existingConfig.timerSeconds || 0,
        timerIcon: existingConfig.timerIcon || "⏰",
        onExpiration: existingConfig.onExpiration || "show_expired",
        expiredTitle: existingConfig.expiredTitle || "OFFER EXPIRED",
        expiredMessage: existingConfig.expiredMessage || "Sorry, this limited time offer has ended. But don't worry, we have other great deals waiting for you!",
        expiredIcon: existingConfig.expiredIcon || "⏰",
        expiredButtonText: existingConfig.expiredButtonText || "CONTINUE SHOPPING",
        successTitle: existingConfig.successTitle || "SUCCESS!",
        successMessage: existingConfig.successMessage || "You've claimed your exclusive discount! Here's your code:",
        disclaimer: existingConfig.disclaimer || "Limited time offer. Valid while supplies last.",
      };
    }
    return {
      title: "LIMITED TIME OFFER!",
      description: "Don't miss out on this exclusive deal. Time is running out!",
      placeholder: "Enter your email to claim this offer",
      buttonText: "CLAIM OFFER NOW",
      discountCode: "TIMER10",
      backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      textColor: "#ffffff",
      borderRadius: 16,
      showCloseButton: true,
      displayDelay: 3000,
      frequency: "once",
      exitIntent: false,
      exitIntentDelay: 1000,
      timerDays: 0,
      timerHours: 0,
      timerMinutes: 5,
      timerSeconds: 0,
      timerIcon: "⏰",
      onExpiration: "show_expired",
      expiredTitle: "OFFER EXPIRED",
      expiredMessage: "Sorry, this limited time offer has ended. But don't worry, we have other great deals waiting for you!",
      expiredIcon: "⏰",
      expiredButtonText: "CONTINUE SHOPPING",
      successTitle: "SUCCESS!",
      successMessage: "You've claimed your exclusive discount! Here's your code:",
      disclaimer: "Limited time offer. Valid while supplies last.",
    };
  });

  // Scratch card popup configuration
  const [scratchCardConfig, setScratchCardConfig] = useState(() => {
    if (existingConfig && existingConfig.type === "scratch-card") {
      return {
        title: existingConfig.title || "Scratch & Win!",
        description: existingConfig.description || "Scratch the card to reveal your exclusive discount and enter your email to claim it!",
        placeholder: existingConfig.placeholder || "Enter your email",
        buttonText: existingConfig.buttonText || "CLAIM DISCOUNT",
        discountCode: existingConfig.discountCode || "SCRATCH10",
        backgroundColor: existingConfig.backgroundColor || "#ffffff",
        textColor: existingConfig.textColor || "#000000",
        borderRadius: existingConfig.borderRadius || 16,
        showCloseButton: existingConfig.showCloseButton !== false,
        displayDelay: existingConfig.displayDelay || 3000,
        frequency: existingConfig.frequency ?? "once",
        exitIntent: existingConfig.exitIntent ?? false,
        exitIntentDelay: existingConfig.exitIntentDelay || 1000,
      };
    }
    return {
      title: "Scratch & Win!",
      description: "Scratch the card to reveal your exclusive discount and enter your email to claim it!",
      placeholder: "Enter your email",
      buttonText: "CLAIM DISCOUNT",
      discountCode: "SCRATCH10",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      borderRadius: 16,
      showCloseButton: true,
      displayDelay: 3000,
      frequency: "once",
      exitIntent: false,
      exitIntentDelay: 1000,
    };
  });

  // Update scratch card config when existingConfig changes
  useEffect(() => {
    if (existingConfig && existingConfig.type === "scratch-card") {
      console.log("=== UPDATING SCRATCH CARD STATE FROM EXISTING CONFIG ===");
      console.log("Existing config:", existingConfig);
      
      setScratchCardConfig({
        title: existingConfig.title || "Scratch & Win!",
        description: existingConfig.description || "Scratch the card to reveal your exclusive discount and enter your email to claim it!",
        placeholder: existingConfig.placeholder || "Enter your email",
        buttonText: existingConfig.buttonText || "CLAIM DISCOUNT",
        discountCode: existingConfig.discountCode || "SCRATCH10",
        backgroundColor: existingConfig.backgroundColor || "#ffffff",
        textColor: existingConfig.textColor || "#000000",
        borderRadius: existingConfig.borderRadius || 16,
        showCloseButton: existingConfig.showCloseButton !== false,
        displayDelay: existingConfig.displayDelay || 3000,
        frequency: existingConfig.frequency ?? "once",
        exitIntent: existingConfig.exitIntent ?? false,
        exitIntentDelay: existingConfig.exitIntentDelay || 1000,
      });
      
      console.log("Updated scratch card config state");
    }
  }, [existingConfig]);

  const handleSaveConfig = useCallback(() => {
    try {
      console.log("=== HANDLE SAVE CONFIG CALLED ===");
      console.log("Current popup type:", popupType);
      
      const config = popupType === "email" ? emailConfig :
                     popupType === "community" ? communityConfig :
                     popupType === "timer" ? timerConfig :
                     popupType === "scratch-card" ? scratchCardConfig :
                     wheelEmailConfig;
      
      console.log("Selected config:", config);
      
      // Debug logging for scratch card
      if (popupType === "scratch-card") {
        console.log("Scratch Card Config being saved:", config);
        console.log("Exit Intent:", config.exitIntent);
        console.log("Frequency:", config.frequency);
        console.log("Discount Code:", config.discountCode);
        console.log("All scratch card config keys:", Object.keys(config));
        console.log("scratchCardConfig state:", scratchCardConfig);
      }
      
      const formData = {
        popupConfig: JSON.stringify({
          type: popupType,
          config,
          name: popupName || `${popupType.charAt(0).toUpperCase() + popupType.slice(1)} Popup`
        })
      };
      
      console.log("Form data being submitted:", formData);
      
      // Include popupId if editing existing popup
      if (popupId) {
        formData.popupId = popupId;
        console.log("Including popupId:", popupId);
      }
      
      console.log("About to submit form data...");
      fetcher.submit(formData, { method: "POST" });
      console.log("Form data submitted!");
      
    } catch (error) {
      console.error("Error in handleSaveConfig:", error);
    }
  }, [popupType, emailConfig, wheelEmailConfig, communityConfig, timerConfig, scratchCardConfig, popupName, popupId, fetcher]);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        shopify.toast.show(fetcher.data.message || "Popup configuration saved successfully!");
      } else if (fetcher.data.error) {
        shopify.toast.show(`Error: ${fetcher.data.error}`, { isError: true });
      }
    }
  }, [fetcher.data, shopify]);

  const popupTypeOptions = [
    { label: "Email Discount Popup", value: "email" },
    { label: "Wheel + Email Combo", value: "wheel-email" },
    { label: "Community Social Popup", value: "community" },
    { label: "Timer Countdown Popup", value: "timer" },
    { label: "Scratch Card Popup", value: "scratch-card" },
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
      
      <Text as="h4" variant="headingSm">Background & Colors</Text>
      
      <InlineStack gap="400">
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Background Type</Text>
          <Select
            options={[
              { label: "Gradient (Default)", value: "gradient" },
              { label: "Solid Color", value: "solid" },
              { label: "Custom Gradient", value: "custom" },
            ]}
            value={wheelEmailConfig.backgroundType || "gradient"}
            onChange={(value) => {
              let newBackground;
              if (value === "gradient") {
                newBackground = "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)";
              } else if (value === "solid") {
                newBackground = "#1e3c72";
              } else {
                newBackground = wheelEmailConfig.backgroundColor || "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)";
              }
              setWheelEmailConfig({
                ...wheelEmailConfig,
                backgroundType: value,
                backgroundColor: newBackground
              });
            }}
          />
        </Box>
        
        {(wheelEmailConfig.backgroundType === "solid" || !wheelEmailConfig.backgroundType || wheelEmailConfig.backgroundType === "gradient") && (
          <Box minWidth="200px">
            <Text as="p" variant="bodyMd">
              {wheelEmailConfig.backgroundType === "solid" ? "Background Color" : "Primary Color"}
            </Text>
            <Box padding="200" background="bg-surface-secondary" borderRadius="200">
              <input
                type="color"
                value={wheelEmailConfig.backgroundType === "solid" ? wheelEmailConfig.backgroundColor : "#1e3c72"}
                onChange={(e) => {
                  const color = e.target.value;
                  let newBackground;
                  if (wheelEmailConfig.backgroundType === "solid") {
                    newBackground = color;
                  } else {
                    // Update gradient with new primary color
                    newBackground = `linear-gradient(135deg, ${color} 0%, #2a5298 100%)`;
                  }
                  setWheelEmailConfig({ ...wheelEmailConfig, backgroundColor: newBackground });
                }}
                style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
              />
            </Box>
          </Box>
        )}
        
        {(wheelEmailConfig.backgroundType === "gradient" || !wheelEmailConfig.backgroundType) && (
          <Box minWidth="200px">
            <Text as="p" variant="bodyMd">Secondary Color</Text>
            <Box padding="200" background="bg-surface-secondary" borderRadius="200">
              <input
                type="color"
                value="#2a5298"
                onChange={(e) => {
                  const color = e.target.value;
                  const primaryColor = wheelEmailConfig.backgroundColor?.match(/#[0-9a-fA-F]{6}/)?.[0] || "#1e3c72";
                  const newBackground = `linear-gradient(135deg, ${primaryColor} 0%, ${color} 100%)`;
                  setWheelEmailConfig({ ...wheelEmailConfig, backgroundColor: newBackground });
                }}
                style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
              />
            </Box>
          </Box>
        )}
      </InlineStack>
      
      {wheelEmailConfig.backgroundType === "custom" && (
        <TextField
          label="Custom Background CSS"
          value={wheelEmailConfig.backgroundColor}
          onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, backgroundColor: value })}
          placeholder="e.g., linear-gradient(45deg, #ff6b6b, #4ecdc4) or #ff6b6b"
          helpText="Enter any valid CSS background value (color, gradient, image, etc.)"
        />
      )}
      
      <Box minWidth="200px">
        <Text as="p" variant="bodyMd">Text Color</Text>
        <Box padding="200" background="bg-surface-secondary" borderRadius="200">
          <input
            type="color"
            value={wheelEmailConfig.textColor || "#ffffff"}
            onChange={(e) => setWheelEmailConfig({ ...wheelEmailConfig, textColor: e.target.value })}
            style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
          />
        </Box>
      </Box>
      
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

  const renderCommunityConfig = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">Community Social Popup Configuration</Text>
      
      <TextField
        label="Popup Title"
        value={communityConfig.title}
        onChange={(value) => setCommunityConfig({ ...communityConfig, title: value })}
        placeholder="Enter popup title (e.g., JOIN OUR COMMUNITY)"
      />
      
      <TextField
        label="Description"
        value={communityConfig.description}
        onChange={(value) => setCommunityConfig({ ...communityConfig, description: value })}
        multiline={3}
        placeholder="Enter popup description"
      />
      
      <TextField
        label="Banner Image URL"
        value={communityConfig.bannerImage}
        onChange={(value) => setCommunityConfig({ ...communityConfig, bannerImage: value })}
        placeholder="Enter banner image URL (optional)"
        helpText="Upload your image to a hosting service and paste the URL here"
      />
      
      <Text as="h4" variant="headingSm">Social Media Icons</Text>
      <BlockStack gap="200">
        {communityConfig.socialIcons.map((social, index) => (
          <InlineStack key={social.platform} gap="200" align="center">
            <Box minWidth="100px">
              <Checkbox
                label={social.platform.charAt(0).toUpperCase() + social.platform.slice(1)}
                checked={social.enabled}
                onChange={(checked) => {
                  const newSocialIcons = [...communityConfig.socialIcons];
                  newSocialIcons[index].enabled = checked;
                  setCommunityConfig({ ...communityConfig, socialIcons: newSocialIcons });
                }}
              />
            </Box>
            <Box minWidth="300px">
              <TextField
                value={social.url}
                onChange={(value) => {
                  const newSocialIcons = [...communityConfig.socialIcons];
                  newSocialIcons[index].url = value;
                  setCommunityConfig({ ...communityConfig, socialIcons: newSocialIcons });
                }}
                placeholder={`${social.platform.charAt(0).toUpperCase() + social.platform.slice(1)} URL`}
                disabled={!social.enabled}
              />
            </Box>
          </InlineStack>
        ))}
      </BlockStack>
      
      <TextField
        label="Ask Me Later Text"
        value={communityConfig.askMeLaterText}
        onChange={(value) => setCommunityConfig({ ...communityConfig, askMeLaterText: value })}
        placeholder="Text for the ask me later link"
      />
      
      <Checkbox
        label="Show Ask Me Later link"
        checked={communityConfig.showAskMeLater}
        onChange={(checked) => setCommunityConfig({ ...communityConfig, showAskMeLater: checked })}
        helpText="Allow users to dismiss the popup temporarily"
      />
      
      <InlineStack gap="400">
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Background Color</Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <input
              type="color"
              value={communityConfig.backgroundColor}
              onChange={(e) => setCommunityConfig({ ...communityConfig, backgroundColor: e.target.value })}
              style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
          </Box>
        </Box>
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Text Color</Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <input
              type="color"
              value={communityConfig.textColor}
              onChange={(e) => setCommunityConfig({ ...communityConfig, textColor: e.target.value })}
              style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
          </Box>
        </Box>
      </InlineStack>
      
      <RangeSlider
        label={`Border Radius: ${communityConfig.borderRadius}px`}
        value={communityConfig.borderRadius}
        onChange={(value) => setCommunityConfig({ ...communityConfig, borderRadius: value })}
        min={0}
        max={20}
        step={1}
      />
      
      <RangeSlider
        label={`Display Delay: ${communityConfig.displayDelay / 1000}s`}
        value={communityConfig.displayDelay}
        onChange={(value) => setCommunityConfig({ ...communityConfig, displayDelay: value })}
        min={0}
        max={10000}
        step={500}
      />
      
      <Checkbox
        label="Show close button"
        checked={communityConfig.showCloseButton}
        onChange={(checked) => setCommunityConfig({ ...communityConfig, showCloseButton: checked })}
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
        value={communityConfig.frequency}
        onChange={(value) => setCommunityConfig({ ...communityConfig, frequency: value })}
        helpText="Control how often the popup appears to the same visitor"
      />
      
      <Checkbox
        label="Enable exit intent detection"
        checked={communityConfig.exitIntent}
        onChange={(checked) => setCommunityConfig({ ...communityConfig, exitIntent: checked })}
        helpText="Show popup when user is about to leave the page"
      />
      
      {communityConfig.exitIntent && (
        <RangeSlider
          label={`Exit intent delay: ${communityConfig.exitIntentDelay}ms`}
          value={communityConfig.exitIntentDelay}
          onChange={(value) => setCommunityConfig({ ...communityConfig, exitIntentDelay: value })}
          min={500}
          max={3000}
          step={100}
          helpText="Delay before exit intent triggers"
        />
      )}
    </BlockStack>
  );

  const renderTimerConfig = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">Timer Countdown Popup Configuration</Text>
      
      <TextField
        label="Popup Title"
        value={timerConfig.title}
        onChange={(value) => setTimerConfig({ ...timerConfig, title: value })}
        placeholder="Enter popup title (e.g., LIMITED TIME OFFER!)"
      />
      
      <TextField
        label="Description"
        value={timerConfig.description}
        onChange={(value) => setTimerConfig({ ...timerConfig, description: value })}
        multiline={3}
        placeholder="Enter popup description"
      />
      
      <TextField
        label="Email Placeholder"
        value={timerConfig.placeholder}
        onChange={(value) => setTimerConfig({ ...timerConfig, placeholder: value })}
        placeholder="Email input placeholder"
      />
      
      <TextField
        label="Button Text"
        value={timerConfig.buttonText}
        onChange={(value) => setTimerConfig({ ...timerConfig, buttonText: value })}
        placeholder="Button text (e.g., CLAIM OFFER NOW)"
      />
      
      <TextField
        label="Discount Code"
        value={timerConfig.discountCode}
        onChange={(value) => setTimerConfig({ ...timerConfig, discountCode: value })}
        placeholder="Discount code to offer"
      />
      
      <Text as="h4" variant="headingSm">Timer Duration</Text>
      <InlineStack gap="400">
        <Box minWidth="120px">
          <TextField
            label="Days"
            type="number"
            value={timerConfig.timerDays.toString()}
            onChange={(value) => setTimerConfig({ ...timerConfig, timerDays: parseInt(value) || 0 })}
            min={0}
            max={365}
          />
        </Box>
        <Box minWidth="120px">
          <TextField
            label="Hours"
            type="number"
            value={timerConfig.timerHours.toString()}
            onChange={(value) => setTimerConfig({ ...timerConfig, timerHours: parseInt(value) || 0 })}
            min={0}
            max={23}
          />
        </Box>
        <Box minWidth="120px">
          <TextField
            label="Minutes"
            type="number"
            value={timerConfig.timerMinutes.toString()}
            onChange={(value) => setTimerConfig({ ...timerConfig, timerMinutes: parseInt(value) || 0 })}
            min={0}
            max={59}
          />
        </Box>
        <Box minWidth="120px">
          <TextField
            label="Seconds"
            type="number"
            value={timerConfig.timerSeconds.toString()}
            onChange={(value) => setTimerConfig({ ...timerConfig, timerSeconds: parseInt(value) || 0 })}
            min={0}
            max={59}
          />
        </Box>
      </InlineStack>
      
      <InlineStack gap="400">
        <Box minWidth="120px">
          <TextField
            label="Timer Icon"
            value={timerConfig.timerIcon}
            onChange={(value) => setTimerConfig({ ...timerConfig, timerIcon: value })}
            placeholder="⏰"
            helpText="Emoji or icon to display"
          />
        </Box>
        <Box minWidth="200px">
          <Select
            label="When Timer Expires"
            options={[
              { label: "Show expired message", value: "show_expired" },
              { label: "Hide popup", value: "hide" },
            ]}
            value={timerConfig.onExpiration}
            onChange={(value) => setTimerConfig({ ...timerConfig, onExpiration: value })}
            helpText="What happens when timer reaches zero"
          />
        </Box>
      </InlineStack>
      
      {timerConfig.onExpiration === "show_expired" && (
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">Expired State Configuration</Text>
          
          <TextField
            label="Expired Title"
            value={timerConfig.expiredTitle}
            onChange={(value) => setTimerConfig({ ...timerConfig, expiredTitle: value })}
            placeholder="OFFER EXPIRED"
          />
          
          <TextField
            label="Expired Message"
            value={timerConfig.expiredMessage}
            onChange={(value) => setTimerConfig({ ...timerConfig, expiredMessage: value })}
            multiline={3}
            placeholder="Message to show when timer expires"
          />
          
          <InlineStack gap="400">
            <Box minWidth="120px">
              <TextField
                label="Expired Icon"
                value={timerConfig.expiredIcon}
                onChange={(value) => setTimerConfig({ ...timerConfig, expiredIcon: value })}
                placeholder="⏰"
              />
            </Box>
            <Box minWidth="200px">
              <TextField
                label="Expired Button Text"
                value={timerConfig.expiredButtonText}
                onChange={(value) => setTimerConfig({ ...timerConfig, expiredButtonText: value })}
                placeholder="CONTINUE SHOPPING"
              />
            </Box>
          </InlineStack>
        </BlockStack>
      )}
      
      <Text as="h4" variant="headingSm">Success State Configuration</Text>
      
      <TextField
        label="Success Title"
        value={timerConfig.successTitle}
        onChange={(value) => setTimerConfig({ ...timerConfig, successTitle: value })}
        placeholder="SUCCESS!"
      />
      
      <TextField
        label="Success Message"
        value={timerConfig.successMessage}
        onChange={(value) => setTimerConfig({ ...timerConfig, successMessage: value })}
        multiline={2}
        placeholder="Message to show when user submits email"
      />
      
      <TextField
        label="Disclaimer Text"
        value={timerConfig.disclaimer}
        onChange={(value) => setTimerConfig({ ...timerConfig, disclaimer: value })}
        placeholder="Limited time offer. Valid while supplies last."
        helpText="Small print text shown at bottom of popup"
      />
      
      <Text as="h4" variant="headingSm">Colors & Styling</Text>
      
      <TextField
        label="Background Gradient/Color"
        value={timerConfig.backgroundColor}
        onChange={(value) => setTimerConfig({ ...timerConfig, backgroundColor: value })}
        placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        helpText="CSS gradient or solid color"
      />
      
      <InlineStack gap="400">
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Text Color</Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <input
              type="color"
              value={timerConfig.textColor}
              onChange={(e) => setTimerConfig({ ...timerConfig, textColor: e.target.value })}
              style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
          </Box>
        </Box>
      </InlineStack>
      
      <RangeSlider
        label={`Border Radius: ${timerConfig.borderRadius}px`}
        value={timerConfig.borderRadius}
        onChange={(value) => setTimerConfig({ ...timerConfig, borderRadius: value })}
        min={0}
        max={30}
        step={1}
      />
      
      <RangeSlider
        label={`Display Delay: ${timerConfig.displayDelay / 1000}s`}
        value={timerConfig.displayDelay}
        onChange={(value) => setTimerConfig({ ...timerConfig, displayDelay: value })}
        min={0}
        max={10000}
        step={500}
      />
      
      <Checkbox
        label="Show close button"
        checked={timerConfig.showCloseButton}
        onChange={(checked) => setTimerConfig({ ...timerConfig, showCloseButton: checked })}
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
        value={timerConfig.frequency}
        onChange={(value) => setTimerConfig({ ...timerConfig, frequency: value })}
        helpText="Control how often the popup appears to the same visitor"
      />
      
      <Checkbox
        label="Enable exit intent detection"
        checked={timerConfig.exitIntent}
        onChange={(checked) => setTimerConfig({ ...timerConfig, exitIntent: checked })}
        helpText="Show popup when user is about to leave the page"
      />
      
      {timerConfig.exitIntent && (
        <RangeSlider
          label={`Exit intent delay: ${timerConfig.exitIntentDelay}ms`}
          value={timerConfig.exitIntentDelay}
          onChange={(value) => setTimerConfig({ ...timerConfig, exitIntentDelay: value })}
          min={500}
          max={3000}
          step={100}
          helpText="Delay before exit intent triggers"
        />
      )}
    </BlockStack>
  );

  const renderScratchCardConfig = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">Scratch Card Popup Configuration</Text>
      
      <TextField
        label="Popup Title"
        value={scratchCardConfig.title}
        onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, title: value })}
        placeholder="Enter popup title (e.g., Scratch & Win!)"
      />
      
      <TextField
        label="Description"
        value={scratchCardConfig.description}
        onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, description: value })}
        multiline={3}
        placeholder="Enter popup description"
      />
      
      <TextField
        label="Email Placeholder"
        value={scratchCardConfig.placeholder}
        onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, placeholder: value })}
        placeholder="Email input placeholder"
      />
      
      <TextField
        label="Button Text"
        value={scratchCardConfig.buttonText}
        onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, buttonText: value })}
        placeholder="Button text (e.g., CLAIM DISCOUNT)"
      />
      
      <TextField
        label="Discount Code"
        value={scratchCardConfig.discountCode || ""}
        onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, discountCode: value })}
        placeholder="Discount code to offer (e.g., SCRATCH10)"
      />
      
      <InlineStack gap="400">
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Background Color</Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <input
              type="color"
              value={scratchCardConfig.backgroundColor}
              onChange={(e) => setScratchCardConfig({ ...scratchCardConfig, backgroundColor: e.target.value })}
              style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
          </Box>
        </Box>
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Text Color</Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <input
              type="color"
              value={scratchCardConfig.textColor}
              onChange={(e) => setScratchCardConfig({ ...scratchCardConfig, textColor: e.target.value })}
              style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
          </Box>
        </Box>
      </InlineStack>
      
      <RangeSlider
        label={`Border Radius: ${scratchCardConfig.borderRadius}px`}
        value={scratchCardConfig.borderRadius}
        onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, borderRadius: value })}
        min={0}
        max={30}
        step={1}
      />
      
      <RangeSlider
        label={`Display Delay: ${scratchCardConfig.displayDelay / 1000}s`}
        value={scratchCardConfig.displayDelay}
        onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, displayDelay: value })}
        min={0}
        max={10000}
        step={500}
      />
      
      <Checkbox
        label="Show close button"
        checked={scratchCardConfig.showCloseButton}
        onChange={(checked) => setScratchCardConfig({ ...scratchCardConfig, showCloseButton: checked })}
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
        value={scratchCardConfig.frequency}
        onChange={(value) => {
          console.log("=== FREQUENCY DROPDOWN CHANGED ===");
          console.log("New value:", value);
          console.log("Current scratchCardConfig:", scratchCardConfig);
          setScratchCardConfig({ ...scratchCardConfig, frequency: value });
          console.log("State should be updated to:", { ...scratchCardConfig, frequency: value });
        }}
        helpText="Control how often the popup appears to the same visitor"
      />
      
      <Checkbox
        label="Enable exit intent detection"
        checked={scratchCardConfig.exitIntent}
        onChange={(checked) => {
          console.log("=== EXIT INTENT CHECKBOX CHANGED ===");
          console.log("New value:", checked);
          console.log("Current scratchCardConfig:", scratchCardConfig);
          setScratchCardConfig({ ...scratchCardConfig, exitIntent: checked });
          console.log("State should be updated to:", { ...scratchCardConfig, exitIntent: checked });
        }}
        helpText="Show popup when user is about to leave the page"
      />
      
      {scratchCardConfig.exitIntent && (
        <RangeSlider
          label={`Exit intent delay: ${scratchCardConfig.exitIntentDelay}ms`}
          value={scratchCardConfig.exitIntentDelay}
          onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, exitIntentDelay: value })}
          min={500}
          max={3000}
          step={100}
          helpText="Delay before exit intent triggers"
        />
      )}
    </BlockStack>
  );

  const renderPreview = () => {
    const config = popupType === "email" ? emailConfig :
                   popupType === "community" ? communityConfig :
                   popupType === "timer" ? timerConfig :
                   popupType === "scratch-card" ? scratchCardConfig :
                   wheelEmailConfig;
    const badgeText = popupType === "email" ? "Email Popup" :
                      popupType === "community" ? "Community Social Popup" :
                      popupType === "timer" ? "Timer Countdown Popup" :
                      popupType === "scratch-card" ? "Scratch Card Popup" :
                      "Wheel + Email Combo";
    
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
            <PopupPreview
              config={config}
              type={popupType}
              disableInteractions={true}
              style={{
                maxWidth: popupType === 'wheel-email' ? '600px' : '400px',
                width: popupType === 'wheel-email' ? '90%' : 'auto',
                margin: '0 auto'
              }}
            />
          </Box>
        </BlockStack>
      </Card>
    );
  };

  // Realtime popup preview component using PopupPreview
  const renderRealtimePopup = () => {
    if (!showRealtimePreview) return null;

    const config = popupType === "email" ? emailConfig :
                   popupType === "community" ? communityConfig :
                   popupType === "timer" ? timerConfig :
                   popupType === "scratch-card" ? scratchCardConfig :
                   wheelEmailConfig;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "fadeIn 0.3s ease-out",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowRealtimePreview(false);
          }
        }}
      >
        <style>
          {`
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
          `}
        </style>
        
        <div style={{ animation: 'popupSlideIn 0.3s ease-out', position: 'relative' }}>
          <PopupPreview
            config={config}
            type={popupType}
            disableInteractions={false}
            style={{
              maxWidth: popupType === 'wheel-email' ? '600px' : '400px',
              width: popupType === 'wheel-email' ? '90%' : 'auto'
            }}
          />
          
          {/* Close button overlay */}
          <button
            onClick={() => setShowRealtimePreview(false)}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000000,
            }}
          >
            ×
          </button>
        </div>
      </div>
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
                
                <TextField
                  label="Popup Name"
                  value={popupName}
                  onChange={setPopupName}
                  placeholder={`${popupType.charAt(0).toUpperCase() + popupType.slice(1)} Popup`}
                  helpText="Give your popup a descriptive name for easy identification"
                />
                
                <Select
                  label="Popup Type"
                  options={popupTypeOptions}
                  value={popupType}
                  onChange={setPopupType}
                />
                
                <Divider />
                
                {popupType === "email" ? renderEmailConfig() :
                 popupType === "community" ? renderCommunityConfig() :
                 popupType === "timer" ? renderTimerConfig() :
                 popupType === "scratch-card" ? renderScratchCardConfig() :
                 renderWheelEmailConfig()}
                
                <InlineStack gap="300">
                  <Button onClick={handleSaveConfig} variant="primary">
                    Save Configuration
                  </Button>
                  <Button
                    onClick={() => setShowRealtimePreview(!showRealtimePreview)}
                    variant="secondary"
                    tone={showRealtimePreview ? "critical" : "base"}
                  >
                    {showRealtimePreview ? "Hide Preview" : "Show Realtime Preview"}
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

      {/* Realtime Popup Preview */}
      {renderRealtimePopup()}
    </Page>
  );
}