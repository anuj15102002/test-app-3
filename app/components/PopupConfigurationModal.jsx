import { useState, useCallback, useEffect } from "react";
import { useFetcher, useNavigate } from "@remix-run/react";
import {
  Modal,
  Layout,
  Card,
  Text,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Select,
  RangeSlider,
  Checkbox,
  Box,
  Badge,
  Divider,
  Icon,
  ChoiceList,
  Combobox,
  Listbox,
  AutoSelection,
  Tabs,
} from "@shopify/polaris";
import { EmailIcon, ClockIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import PopupPreview from "./PopupPreview";
import "../styles/timer-popup-modal.css";

/**
 * PopupConfigurationModal - Universal modal that contains the entire popup customizer interface
 *
 * This is the main configuration modal that provides a comprehensive interface for customizing
 * all types of popups. It features a two-panel layout with configuration settings on the left
 * and a live preview on the right.
 *
 * Key Features:
 * - Two-panel layout (Configuration Settings + Live Preview)
 * - Supports all popup types (email, wheel-email, community, timer, scratch-card)
 * - Real-time configuration updates with instant preview
 * - Page targeting system for controlling where popups appear
 * - Shopify Polaris UI components for consistent design
 * - Mobile responsive design with adaptive layouts
 * - Form validation and error handling
 * - Save/cancel functionality with loading states
 *
 * Props:
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {object} initialConfig - Existing popup configuration for editing
 * @param {string} initialPopupType - Default popup type to display
 * @param {string} initialPopupName - Default name for the popup
 */
export default function PopupConfigurationModal({
  isOpen,
  onClose,
  initialConfig = null,
  initialPopupType = "wheel-email",
  initialPopupName = ""
}) {
  // ============================================================================
  // HOOKS AND CORE STATE MANAGEMENT
  // ============================================================================
  
  const fetcher = useFetcher(); // Remix fetcher for form submissions
  const shopify = useAppBridge(); // Shopify App Bridge for toast notifications
  const navigate = useNavigate(); // Navigation hook for redirects
  
  // ============================================================================
  // POPUP TYPE AND BASIC CONFIGURATION STATE
  // ============================================================================
  
  // Current popup type (email, wheel-email, community, timer, scratch-card)
  const [popupType, setPopupType] = useState(initialPopupType);
  
  // Popup name for identification in the admin interface
  const [popupName, setPopupName] = useState(initialConfig?.name || initialPopupName || "");
  
  // State for popup name validation
  const [popupNameError, setPopupNameError] = useState("");
  const [existingPopupNames, setExistingPopupNames] = useState([]);
  
  // ============================================================================
  // TAB MANAGEMENT STATE
  // ============================================================================
  
  // Active tab state for the three-section interface
  const [activeTab, setActiveTab] = useState(0);
  
  // ============================================================================
  // DEVICE PREVIEW STATE
  // ============================================================================
  
  // Device preview state - controls desktop vs mobile preview
  const [previewDevice, setPreviewDevice] = useState('desktop');
  
  // ============================================================================
  // PAGE TARGETING SYSTEM STATE
  // ============================================================================
  
  // Page targeting configuration - controls where the popup appears on the storefront
  const [pageTargeting, setPageTargeting] = useState(() => {
    if (initialConfig) {
      return {
        targetAllPages: initialConfig.targetAllPages !== false, // Show on all pages by default
        targetSpecificPages: initialConfig.targetSpecificPages || false, // Show on specific pages only
        selectedPages: initialConfig.pageTargeting ? JSON.parse(initialConfig.pageTargeting) : [] // Array of selected pages
      };
    }
    return {
      targetAllPages: true, // Default: show on all pages
      targetSpecificPages: false,
      selectedPages: []
    };
  });
  
  // Storefront pages data fetched from Shopify Admin API
  const [storefrontPages, setStorefrontPages] = useState({
    collections: [], // Collection pages
    products: [], // Product pages
    pages: [], // Custom pages
    staticPages: [] // Static pages (home, cart, etc.)
  });
  const [pagesLoading, setPagesLoading] = useState(false); // Loading state for page fetching
  
  // Custom URL input for manual page targeting
  const [customUrl, setCustomUrl] = useState('');
  
  // ============================================================================
  // POPUP TYPE-SPECIFIC CONFIGURATION STATES
  // ============================================================================
  
  // EMAIL POPUP CONFIGURATION
  // Simple email capture popup with discount offer
  const [emailConfig, setEmailConfig] = useState(() => {
    if (initialConfig && initialConfig.type === "email") {
      return {
        title: initialConfig.title || "Get 10% Off Your First Order!",
        description: initialConfig.description || "Subscribe to our newsletter and receive exclusive discounts",
        placeholder: initialConfig.placeholder || "Enter your email address",
        buttonText: initialConfig.buttonText || "Get Discount",
        discountCode: initialConfig.discountCode || "WELCOME10",
        backgroundColor: initialConfig.backgroundColor || "#ffffff",
        textColor: initialConfig.textColor || "#000000",
        buttonColor: initialConfig.buttonColor || "#007ace",
        borderRadius: initialConfig.borderRadius || 8,
        showCloseButton: initialConfig.showCloseButton !== false,
        displayDelay: initialConfig.displayDelay || 3000,
        frequency: initialConfig.frequency || "once",
        exitIntent: initialConfig.exitIntent || false,
        exitIntentDelay: initialConfig.exitIntentDelay || 1000,
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

  // WHEEL-EMAIL COMBO CONFIGURATION
  // Interactive spinning wheel combined with email capture
  const [wheelEmailConfig, setWheelEmailConfig] = useState(() => {
    if (initialConfig && initialConfig.type === "wheel-email") {
      const backgroundColor = initialConfig.backgroundColor || "linear-gradient(135deg, #09090aff 0%, #2a5298 100%)";
      let backgroundType = "gradient";
      
      if (backgroundColor.includes("linear-gradient") || backgroundColor.includes("radial-gradient")) {
        backgroundType = "gradient";
      } else if (backgroundColor.startsWith("#") || backgroundColor.startsWith("rgb") || backgroundColor.startsWith("hsl")) {
        backgroundType = "solid";
      } else {
        backgroundType = "custom";
      }
      
      return {
        title: initialConfig.title || "GET YOUR CHANCE TO WIN",
        subtitle: initialConfig.subtitle || "AMAZING DISCOUNTS!",
        description: initialConfig.description || "Enter your email below and spin the wheel to see if you're our next lucky winner!",
        placeholder: initialConfig.placeholder || "Enter your email",
        buttonText: initialConfig.buttonText || "TRY YOUR LUCK",
        discountCode: initialConfig.discountCode || "SAVE5",
        segments: initialConfig.segments ? JSON.parse(initialConfig.segments) : [
          { label: '5% OFF', color: '#0a2a43', code: 'SAVE5' },
          { label: '10% OFF', color: '#133b5c', code: 'SAVE10' },
          { label: '15% OFF', color: '#0a2a43', code: 'SAVE15' },
          { label: '20% OFF', color: '#133b5c', code: 'SAVE20' },
          { label: 'FREE SHIPPING', color: '#0a2a43', code: 'FREESHIP' },
          { label: 'TRY AGAIN', color: '#133b5c', code: null }
        ],
        backgroundColor: backgroundColor,
        backgroundType: backgroundType,
        textColor: "#ffffff",
        displayDelay: initialConfig.displayDelay || 3000,
        frequency: initialConfig.frequency || "once",
        exitIntent: initialConfig.exitIntent || false,
        exitIntentDelay: initialConfig.exitIntentDelay || 1000,
        houseRules: initialConfig.houseRules || [
          "Winnings through cheating will not be processed.",
          "Only one spin allowed"
        ],
        showHouseRules: initialConfig.showHouseRules !== false,
      };
    }
    return {
      title: "GET YOUR CHANCE TO WIN",
      subtitle: "AMAZING DISCOUNTS!",
      description: "Enter your email below and spin the wheel to see if you're our next lucky winner!",
      placeholder: "Enter your email",
      buttonText: "TRY YOUR LUCK",
      discountCode: "SAVE10",
      segments: [
        { label: '5% OFF', color: '#0a2a43', code: 'SAVE5' },
        { label: '10% OFF', color: '#133b5c', code: 'SAVE10' },
        { label: '15% OFF', color: '#0a2a43', code: 'SAVE15' },
        { label: '20% OFF', color: '#133b5c', code: 'SAVE20' },
        { label: 'FREE SHIPPING', color: '#0a2a43', code: 'FREESHIP' },
        { label: 'TRY AGAIN', color: '#133b5c', code: null }
      ],
      backgroundColor: "linear-gradient(135deg, #09090aff 0%, #2a5298 100%)",
      backgroundType: "gradient",
      textColor: "#ffffff",
      displayDelay: 3000,
      frequency: "once",
      exitIntent: false,
      exitIntentDelay: 1000,
      houseRules: [
        "Winnings through cheating will not be processed.",
        "Only one spin allowed"
      ],
      showHouseRules: true,
    };
  });

  // COMMUNITY SOCIAL POPUP CONFIGURATION
  // Social media follow popup with banner image and social icons
  const [communityConfig, setCommunityConfig] = useState(() => {
    if (initialConfig && initialConfig.type === "community") {
      return {
        title: initialConfig.title || "JOIN OUR COMMUNITY",
        description: initialConfig.description || "Connect with us on social media and stay updated with our latest news and offers!",
        buttonText: initialConfig.buttonText || "Follow Us",
        bannerImage: initialConfig.bannerImage || "",
        socialIcons: initialConfig.socialIcons ? JSON.parse(initialConfig.socialIcons) : [
          { platform: 'facebook', url: '', enabled: true },
          { platform: 'instagram', url: '', enabled: true },
          { platform: 'linkedin', url: '', enabled: true },
          { platform: 'x', url: '', enabled: true }
        ],
        askMeLaterText: initialConfig.askMeLaterText || "Ask me later",
        showAskMeLater: initialConfig.showAskMeLater !== false,
        backgroundColor: initialConfig.backgroundColor || "#ffffff",
        textColor: initialConfig.textColor || "#000000",
        borderRadius: initialConfig.borderRadius || 12,
        showCloseButton: initialConfig.showCloseButton !== false,
        displayDelay: initialConfig.displayDelay || 3000,
        frequency: initialConfig.frequency || "once",
        exitIntent: initialConfig.exitIntent || false,
        exitIntentDelay: initialConfig.exitIntentDelay || 1000,
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

  // TIMER COUNTDOWN POPUP CONFIGURATION
  // Urgency-driven popup with countdown timer and email capture
  const [timerConfig, setTimerConfig] = useState(() => {
    if (initialConfig && initialConfig.type === "timer") {
      return {
        title: initialConfig.title || "LIMITED TIME OFFER!",
        description: initialConfig.description || "Don't miss out on this exclusive deal. Time is running out!",
        placeholder: initialConfig.placeholder || "Enter your email to claim this offer",
        buttonText: initialConfig.buttonText || "CLAIM OFFER NOW",
        discountCode: initialConfig.discountCode || "TIMER10",
        backgroundColor: initialConfig.backgroundColor || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        textColor: initialConfig.textColor || "#ffffff",
        borderRadius: initialConfig.borderRadius || 16,
        showCloseButton: initialConfig.showCloseButton !== false,
        displayDelay: initialConfig.displayDelay || 3000,
        frequency: initialConfig.frequency || "once",
        exitIntent: initialConfig.exitIntent || false,
        exitIntentDelay: initialConfig.exitIntentDelay || 1000,
        timerDays: initialConfig.timerDays || 0,
        timerHours: initialConfig.timerHours || 0,
        timerMinutes: initialConfig.timerMinutes || 5,
        timerSeconds: initialConfig.timerSeconds || 0,
        timerIcon: initialConfig.timerIcon || "⏰",
        onExpiration: initialConfig.onExpiration || "show_expired",
        expiredTitle: initialConfig.expiredTitle || "OFFER EXPIRED",
        expiredMessage: initialConfig.expiredMessage || "Sorry, this limited time offer has ended. But don't worry, we have other great deals waiting for you!",
        expiredIcon: initialConfig.expiredIcon || "⏰",
        expiredButtonText: initialConfig.expiredButtonText || "CONTINUE SHOPPING",
        successTitle: initialConfig.successTitle || "SUCCESS!",
        successMessage: initialConfig.successMessage || "You've claimed your exclusive discount! Here's your code:",
        disclaimer: initialConfig.disclaimer || "Limited time offer. Valid while supplies last.",
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

  // SCRATCH CARD POPUP CONFIGURATION
  // Interactive scratch-to-reveal discount popup with email capture
  const [scratchCardConfig, setScratchCardConfig] = useState(() => {
    if (initialConfig && initialConfig.type === "scratch-card") {
      return {
        title: initialConfig.title || "Scratch & Win!",
        description: initialConfig.description || "Scratch the card to reveal your exclusive discount and enter your email to claim it!",
        placeholder: initialConfig.placeholder || "Enter your email",
        buttonText: initialConfig.buttonText || "CLAIM DISCOUNT",
        discountCode: initialConfig.discountCode || "SCRATCH10",
        scratchDiscountPercentage: initialConfig.scratchDiscountPercentage || initialConfig.discountPercentage || 15,
        backgroundColor: initialConfig.backgroundColor || "#ffffff",
        textColor: initialConfig.textColor || "#000000",
        borderRadius: initialConfig.borderRadius || 16,
        showCloseButton: initialConfig.showCloseButton !== false,
        displayDelay: initialConfig.displayDelay || 3000,
        frequency: initialConfig.frequency || "once",
        exitIntent: initialConfig.exitIntent || false,
        exitIntentDelay: initialConfig.exitIntentDelay || 1000,
      };
    }
    return {
      title: "Scratch & Win!",
      description: "Scratch the card to reveal your exclusive discount and enter your email to claim it!",
      placeholder: "Enter your email",
      buttonText: "CLAIM DISCOUNT",
      discountCode: "SCRATCH10",
      scratchDiscountPercentage: 15,
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

  // ============================================================================
  // API FUNCTIONS AND DATA FETCHING
  // ============================================================================
  
  // Fetch available storefront pages from Shopify Admin API
  // This populates the page targeting options with actual store pages
  const fetchStorefrontPages = useCallback(async () => {
    if (pagesLoading || storefrontPages.staticPages.length > 0) return;
    
    setPagesLoading(true);
    try {
      const response = await fetch('/api/admin/storefront-pages');
      const data = await response.json();
      
      if (data.success) {
        setStorefrontPages(data.storefrontPages);
      }
    } catch (error) {
      console.error('Error fetching storefront pages:', error);
    } finally {
      setPagesLoading(false);
    }
  }, [pagesLoading, storefrontPages.staticPages.length]);

  // Fetch existing popup names for validation
  const fetchExistingPopupNames = useCallback(async () => {
    try {
      const response = await fetch('/app/popups');
      if (response.ok) {
        const html = await response.text();
        // Extract popup names from the response (this is a simple approach)
        // In a real implementation, you'd want a dedicated API endpoint
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const popupElements = doc.querySelectorAll('[data-popup-name]');
        const names = Array.from(popupElements).map(el => el.getAttribute('data-popup-name'));
        setExistingPopupNames(names);
      }
    } catch (error) {
      console.error('Error fetching existing popup names:', error);
      // Fallback: try to get names from localStorage or other source
      setExistingPopupNames([]);
    }
  }, []);

  // Validate popup name for duplicates
  const validatePopupName = useCallback((name) => {
    if (!name.trim()) {
      setPopupNameError("Popup name is required");
      return false;
    }
    
    // Check for duplicates (exclude current popup if editing)
    const trimmedName = name.trim();
    const isDuplicate = existingPopupNames.some(existingName =>
      existingName.toLowerCase() === trimmedName.toLowerCase() &&
      existingName !== initialConfig?.name
    );
    
    if (isDuplicate) {
      setPopupNameError("A popup with this name already exists. Please choose a different name.");
      return false;
    }
    
    setPopupNameError("");
    return true;
  }, [existingPopupNames, initialConfig?.name]);

  // Load storefront pages and existing popup names when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStorefrontPages();
      fetchExistingPopupNames();
    }
  }, [isOpen, fetchStorefrontPages, fetchExistingPopupNames]);

  // ============================================================================
  // SAVE AND FORM SUBMISSION HANDLERS
  // ============================================================================
  
  // Main save handler - processes all configuration data and submits to backend
  const handleSaveConfig = useCallback(() => {
    const config = popupType === "email" ? emailConfig :
                   popupType === "community" ? communityConfig :
                   popupType === "timer" ? timerConfig :
                   popupType === "scratch-card" ? scratchCardConfig :
                   wheelEmailConfig;
    
    // Generate a default name if not provided
    const finalPopupName = popupName || `${popupType.charAt(0).toUpperCase() + popupType.slice(1)} Popup - ${new Date().toLocaleDateString()}`;
    
    // Validate popup name before saving
    if (!validatePopupName(finalPopupName)) {
      shopify.toast.show("Please fix the popup name error before saving.", { isError: true });
      return;
    }
    
    const formData = {
      popupConfig: JSON.stringify({
        type: popupType,
        config,
        name: finalPopupName,
        pageTargeting: {
          targetAllPages: pageTargeting.targetAllPages,
          targetSpecificPages: pageTargeting.targetSpecificPages,
          selectedPages: pageTargeting.selectedPages
        }
      })
    };
    
    // Include popupId if editing existing popup
    if (initialConfig?.id) {
      formData.popupId = initialConfig.id;
    }
    
    fetcher.submit(formData, { method: "POST", action: "/app/popup-customizer" });
    
    // Close modal after save - this will trigger the parent to close both modals
    onClose();
  }, [popupType, emailConfig, wheelEmailConfig, communityConfig, timerConfig, scratchCardConfig, popupName, pageTargeting, initialConfig, fetcher, onClose, validatePopupName, shopify]);

  // Handle API response after form submission
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        shopify.toast.show("Popup configuration saved successfully!");
        // Navigate to manage popup page to refresh the list
        setTimeout(() => {
          navigate("/app/popups");
        }, 1000); // Small delay to show the toast
      } else if (fetcher.data.error) {
        shopify.toast.show(`Error: ${fetcher.data.error}`, { isError: true });
      }
    }
  }, [fetcher.data, shopify, navigate]);

  // ============================================================================
  // UTILITY FUNCTIONS AND HELPERS
  // ============================================================================
  
  // Available popup types for the dropdown selector
  const popupTypeOptions = [
    { label: "Email Discount Popup", value: "email" },
    { label: "Wheel + Email Combo", value: "wheel-email" },
    { label: "Community Social Popup", value: "community" },
    { label: "Timer Countdown Popup", value: "timer" },
    { label: "Scratch Card Popup", value: "scratch-card" },
  ];

  // Get current configuration object based on selected popup type
  const getCurrentConfig = () => {
    switch (popupType) {
      case "email": return emailConfig;
      case "community": return communityConfig;
      case "timer": return timerConfig;
      case "scratch-card": return scratchCardConfig;
      default: return wheelEmailConfig;
    }
  };

  // ============================================================================
  // TABBED CONFIGURATION RENDER FUNCTIONS
  // ============================================================================
  
  // Tab definitions for the three-section interface
  const tabs = [
    {
      id: 'rules',
      content: '📋 Rules',
      accessibilityLabel: 'Rules configuration',
      panelID: 'rules-panel',
    },
    {
      id: 'content',
      content: '📝 Content',
      accessibilityLabel: 'Content configuration',
      panelID: 'content-panel',
    },
    {
      id: 'style',
      content: '🎨 Style',
      accessibilityLabel: 'Style configuration',
      panelID: 'style-panel',
    },
  ];


  // ============================================================================
  // RULES SECTION RENDERER
  // ============================================================================
  
  // Renders the Rules tab - controls when, where, and how often popup appears
  const renderRulesSection = () => {
    const config = getCurrentConfig();
    
    return (
      <BlockStack gap="500">
        {/* Display Timing */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">Display Timing</Text>
          
          <RangeSlider
            label={`Display Delay: ${config.displayDelay / 1000}s`}
            value={config.displayDelay}
            onChange={(value) => {
              const updateConfig = popupType === "email" ? setEmailConfig :
                                 popupType === "community" ? setCommunityConfig :
                                 popupType === "timer" ? setTimerConfig :
                                 popupType === "scratch-card" ? setScratchCardConfig :
                                 setWheelEmailConfig;
              updateConfig(prev => ({ ...prev, displayDelay: value }));
            }}
            min={0}
            max={10000}
            step={500}
            helpText="How long to wait before showing the popup after page load"
          />
          
          <Checkbox
            label="Enable exit intent detection"
            checked={config.exitIntent}
            onChange={(checked) => {
              const updateConfig = popupType === "email" ? setEmailConfig :
                                 popupType === "community" ? setCommunityConfig :
                                 popupType === "timer" ? setTimerConfig :
                                 popupType === "scratch-card" ? setScratchCardConfig :
                                 setWheelEmailConfig;
              updateConfig(prev => ({ ...prev, exitIntent: checked }));
            }}
            helpText="Show popup when user is about to leave the page"
          />
          
          {config.exitIntent && (
            <RangeSlider
              label={`Exit intent delay: ${config.exitIntentDelay}ms`}
              value={config.exitIntentDelay}
              onChange={(value) => {
                const updateConfig = popupType === "email" ? setEmailConfig :
                                   popupType === "community" ? setCommunityConfig :
                                   popupType === "timer" ? setTimerConfig :
                                   popupType === "scratch-card" ? setScratchCardConfig :
                                   setWheelEmailConfig;
                updateConfig(prev => ({ ...prev, exitIntentDelay: value }));
              }}
              min={500}
              max={3000}
              step={100}
              helpText="Delay before exit intent triggers"
            />
          )}
        </BlockStack>
        
        <Divider />
        
        {/* Display Frequency */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">Display Frequency</Text>
          
          <Select
            label="How often to show popup"
            options={[
              { label: "Show once per visitor", value: "once" },
              { label: "Show once per day", value: "daily" },
              { label: "Show once per week", value: "weekly" },
              { label: "Show on every visit", value: "always" },
            ]}
            value={config.frequency}
            onChange={(value) => {
              const updateConfig = popupType === "email" ? setEmailConfig :
                                 popupType === "community" ? setCommunityConfig :
                                 popupType === "timer" ? setTimerConfig :
                                 popupType === "scratch-card" ? setScratchCardConfig :
                                 setWheelEmailConfig;
              updateConfig(prev => ({ ...prev, frequency: value }));
            }}
            helpText="Control how often the popup appears to the same visitor"
          />
        </BlockStack>
        
        <Divider />
        
        {/* Behavior Settings */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">Behavior Settings</Text>
          
          <Checkbox
            label="Show close button"
            checked={config.showCloseButton !== false}
            onChange={(checked) => {
              const updateConfig = popupType === "email" ? setEmailConfig :
                                 popupType === "community" ? setCommunityConfig :
                                 popupType === "timer" ? setTimerConfig :
                                 popupType === "scratch-card" ? setScratchCardConfig :
                                 setWheelEmailConfig;
              updateConfig(prev => ({ ...prev, showCloseButton: checked }));
            }}
            helpText="Allow users to close the popup manually"
          />
        </BlockStack>
        
        <Divider />
        
        {/* Page Targeting */}
        {renderPageTargeting()}
      </BlockStack>
    );
  };

  // ============================================================================
  // CONTENT SECTION RENDERER
  // ============================================================================
  
  // Renders the Content tab - all text, images, and messaging
  const renderContentSection = () => {
    switch (popupType) {
      case "email":
        return renderEmailContentFields();
      case "community":
        return renderCommunityContentFields();
      case "timer":
        return renderTimerContentFields();
      case "scratch-card":
        return renderScratchCardContentFields();
      default:
        return renderWheelEmailContentFields();
    }
  };

  // ============================================================================
  // STYLE SECTION RENDERER
  // ============================================================================
  
  // Renders the Style tab - colors, layout, and appearance
  const renderStyleSection = () => {
    switch (popupType) {
      case "email":
        return renderEmailStyleFields();
      case "community":
        return renderCommunityStyleFields();
      case "timer":
        return renderTimerStyleFields();
      case "scratch-card":
        return renderScratchCardStyleFields();
      default:
        return renderWheelEmailStyleFields();
    }
  };

  // ============================================================================
  // EMAIL POPUP CONTENT FIELDS
  // ============================================================================
  
  const renderEmailContentFields = () => (
    <BlockStack gap="400">
      {/* <Text as="h3" variant="headingMd">📝 Email Popup Content</Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Configure all text content and messaging for your email popup
      </Text> */}
      
      <Divider />
      
      {/* Main Content */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Main Content</Text>
        
        <TextField
          label="Popup Title"
          value={emailConfig.title}
          onChange={(value) => setEmailConfig({ ...emailConfig, title: value })}
          placeholder="Enter popup title"
          helpText="Main headline that grabs attention"
        />
        
        <TextField
          label="Description"
          value={emailConfig.description}
          onChange={(value) => setEmailConfig({ ...emailConfig, description: value })}
          multiline={3}
          placeholder="Enter popup description"
          helpText="Supporting text that explains the offer"
        />
      </BlockStack>
      
      <Divider />
      
      {/* Form Elements */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Form Elements</Text>
        
        <TextField
          label="Email Placeholder"
          value={emailConfig.placeholder}
          onChange={(value) => setEmailConfig({ ...emailConfig, placeholder: value })}
          placeholder="Email input placeholder"
          helpText="Placeholder text shown in the email input field"
        />
        
        <TextField
          label="Button Text"
          value={emailConfig.buttonText}
          onChange={(value) => setEmailConfig({ ...emailConfig, buttonText: value })}
          placeholder="Button text"
          helpText="Text displayed on the submit button"
        />
      </BlockStack>
      
      <Divider />
      
      {/* Discount & Images */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Discount & Images</Text>
        
        <TextField
          label="Discount Code"
          value={emailConfig.discountCode}
          onChange={(value) => setEmailConfig({ ...emailConfig, discountCode: value })}
          placeholder="Discount code to offer"
          helpText="The discount code customers will receive"
        />
        
        <TextField
          label="Banner Image URL"
          value={emailConfig.bannerImage}
          onChange={(value) => setEmailConfig({ ...emailConfig, bannerImage: value })}
          placeholder="Enter banner image URL (optional)"
          helpText="Upload your image to a hosting service and paste the URL here. This image will be displayed on the left side of the popup."
        />
      </BlockStack>
    </BlockStack>
  );

  // ============================================================================
  // EMAIL POPUP STYLE FIELDS
  // ============================================================================
  
  const renderEmailStyleFields = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">🎨 Email Popup Style</Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Customize the visual appearance and layout of your email popup
      </Text>
      
      <Divider />
      
      {/* Colors */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Colors</Text>
        
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
      </BlockStack>
      
      <Divider />
      
      {/* Layout */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Layout</Text>
        
        <RangeSlider
          label={`Border Radius: ${emailConfig.borderRadius}px`}
          value={emailConfig.borderRadius}
          onChange={(value) => setEmailConfig({ ...emailConfig, borderRadius: value })}
          min={0}
          max={20}
          step={1}
          helpText="Roundness of popup corners"
        />
      </BlockStack>
    </BlockStack>
  );

  // ============================================================================
  // WHEEL-EMAIL COMBO CONTENT FIELDS
  // ============================================================================
  
  const renderWheelEmailContentFields = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">📝 Wheel + Email Content</Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Configure all text content and wheel segments for your spinning wheel popup
      </Text>
      
      <Divider />
      
      {/* Main Content */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Main Content</Text>
        
        <TextField
          label="Main Title"
          value={wheelEmailConfig.title}
          onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, title: value })}
          placeholder="Main title (e.g., GET YOUR CHANCE TO WIN)"
          helpText="Primary headline for the popup"
        />
        
        <TextField
          label="Subtitle"
          value={wheelEmailConfig.subtitle}
          onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, subtitle: value })}
          placeholder="Subtitle (e.g., AMAZING DISCOUNTS!)"
          helpText="Secondary headline below the main title"
        />
        
        <TextField
          label="Description"
          value={wheelEmailConfig.description}
          onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, description: value })}
          multiline={3}
          placeholder="Description text"
          helpText="Explanation of how the wheel works"
        />
      </BlockStack>
      
      <Divider />
      
      {/* Form Elements */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Form Elements</Text>
        
        <TextField
          label="Email Placeholder"
          value={wheelEmailConfig.placeholder}
          onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, placeholder: value })}
          placeholder="Email input placeholder"
          helpText="Placeholder text for the email input"
        />
        
        <TextField
          label="Button Text"
          value={wheelEmailConfig.buttonText}
          onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, buttonText: value })}
          placeholder="Button text (e.g., TRY YOUR LUCK)"
          helpText="Text on the spin button"
        />
        
        <TextField
          label="Default Discount Code"
          value={wheelEmailConfig.discountCode}
          onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, discountCode: value })}
          placeholder="Default discount code for winners"
          helpText="Fallback discount code"
        />
      </BlockStack>
      
      <Divider />
      
      {/* Wheel Segments */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Wheel Segments</Text>
        <Text as="p" variant="bodyMd" tone="subdued">
          Configure the prizes and labels on your spinning wheel
        </Text>
        
        <BlockStack gap="200">
          {wheelEmailConfig.segments.map((segment, index) => (
            <InlineStack key={index} gap="200" align="center">
              <Box minWidth="120px">
                <TextField
                  label={`Segment ${index + 1} Label`}
                  value={segment.label}
                  onChange={(value) => {
                    const newSegments = [...wheelEmailConfig.segments];
                    newSegments[index].label = value;
                    setWheelEmailConfig({ ...wheelEmailConfig, segments: newSegments });
                  }}
                  placeholder="Segment text"
                />
              </Box>
              <Box minWidth="100px">
                <TextField
                  label="Discount Code"
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
      </BlockStack>
      
      <Divider />
      
      {/* House Rules */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">House Rules</Text>
        
        <Checkbox
          label="Show house rules section"
          checked={wheelEmailConfig.showHouseRules}
          onChange={(checked) => setWheelEmailConfig({ ...wheelEmailConfig, showHouseRules: checked })}
          helpText="Display rules and terms at the bottom of the popup"
        />
        
        {wheelEmailConfig.showHouseRules && (
          <BlockStack gap="200">
            {wheelEmailConfig.houseRules.map((rule, index) => (
              <InlineStack key={index} gap="200" align="center">
                <Box minWidth="400px">
                  <TextField
                    label={`Rule ${index + 1}`}
                    value={rule}
                    onChange={(value) => {
                      const newRules = [...wheelEmailConfig.houseRules];
                      newRules[index] = value;
                      setWheelEmailConfig({ ...wheelEmailConfig, houseRules: newRules });
                    }}
                    placeholder={`House rule ${index + 1}`}
                  />
                </Box>
                <Button
                  onClick={() => {
                    const newRules = wheelEmailConfig.houseRules.filter((_, i) => i !== index);
                    setWheelEmailConfig({ ...wheelEmailConfig, houseRules: newRules });
                  }}
                  variant="plain"
                  tone="critical"
                  disabled={wheelEmailConfig.houseRules.length <= 1}
                >
                  Remove
                </Button>
              </InlineStack>
            ))}
            <Button
              onClick={() => {
                const newRules = [...wheelEmailConfig.houseRules, ""];
                setWheelEmailConfig({ ...wheelEmailConfig, houseRules: newRules });
              }}
              variant="plain"
            >
              Add Rule
            </Button>
          </BlockStack>
        )}
      </BlockStack>
    </BlockStack>
  );

  // ============================================================================
  // WHEEL-EMAIL COMBO STYLE FIELDS
  // ============================================================================
  
  const renderWheelEmailStyleFields = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">🎨 Wheel + Email Style</Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Customize the visual appearance of your spinning wheel popup
      </Text>
      
      <Divider />
      
      {/* Wheel Segment Colors */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Wheel Segment Colors</Text>
        
        <BlockStack gap="200">
          {wheelEmailConfig.segments.map((segment, index) => (
            <InlineStack key={index} gap="200" align="center">
              <Box minWidth="120px">
                <Text variant="bodyMd">{segment.label}</Text>
              </Box>
              <Box minWidth="60px">
                <Text as="p" variant="bodyMd">Color</Text>
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
            </InlineStack>
          ))}
        </BlockStack>
      </BlockStack>
      
      <Divider />
      
      {/* Background & Colors */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Background & Colors</Text>
        
        <TextField
          label="Background Gradient/Color"
          value={wheelEmailConfig.backgroundColor}
          onChange={(value) => setWheelEmailConfig({ ...wheelEmailConfig, backgroundColor: value })}
          placeholder="linear-gradient(135deg, #09090aff 0%, #2a5298 100%)"
          helpText="CSS gradient or solid color for popup background"
        />
        
        <InlineStack gap="400">
          <Box minWidth="200px">
            <Text as="p" variant="bodyMd">Text Color</Text>
            <Box padding="200" background="bg-surface-secondary" borderRadius="200">
              <input
                type="color"
                value={wheelEmailConfig.textColor}
                onChange={(e) => setWheelEmailConfig({ ...wheelEmailConfig, textColor: e.target.value })}
                style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
              />
            </Box>
          </Box>
        </InlineStack>
      </BlockStack>
    </BlockStack>
  );

  // ============================================================================
  // COMMUNITY POPUP CONTENT FIELDS
  // ============================================================================
  
  const renderCommunityContentFields = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">📝 Community Content</Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Configure all text content and social media links for your community popup
      </Text>
      
      <Divider />
      
      {/* Main Content */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Main Content</Text>
        
        <TextField
          label="Popup Title"
          value={communityConfig.title}
          onChange={(value) => setCommunityConfig({ ...communityConfig, title: value })}
          placeholder="Enter popup title (e.g., JOIN OUR COMMUNITY)"
          helpText="Main headline that encourages social engagement"
        />
        
        <TextField
          label="Description"
          value={communityConfig.description}
          onChange={(value) => setCommunityConfig({ ...communityConfig, description: value })}
          multiline={3}
          placeholder="Enter popup description"
          helpText="Supporting text that explains the benefits of following"
        />
        
        <TextField
          label="Button Text"
          value={communityConfig.buttonText}
          onChange={(value) => setCommunityConfig({ ...communityConfig, buttonText: value })}
          placeholder="Button text (e.g., Follow Us)"
          helpText="Text displayed on the main action button"
        />
      </BlockStack>
      
      <Divider />
      
      {/* Banner Image */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Banner Image</Text>
        
        <TextField
          label="Banner Image URL"
          value={communityConfig.bannerImage}
          onChange={(value) => setCommunityConfig({ ...communityConfig, bannerImage: value })}
          placeholder="Enter banner image URL (optional)"
          helpText="Upload your image to a hosting service and paste the URL here. This image will be displayed at the top of the popup."
        />
      </BlockStack>
      
      <Divider />
      
      {/* Social Media Links */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Social Media Links</Text>
        <Text as="p" variant="bodyMd" tone="subdued">
          Configure which social platforms to display and their URLs
        </Text>
        
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
                  label={`${social.platform.charAt(0).toUpperCase() + social.platform.slice(1)} URL`}
                  value={social.url}
                  onChange={(value) => {
                    const newSocialIcons = [...communityConfig.socialIcons];
                    newSocialIcons[index].url = value;
                    setCommunityConfig({ ...communityConfig, socialIcons: newSocialIcons });
                  }}
                  placeholder={`https://${social.platform}.com/yourpage`}
                  disabled={!social.enabled}
                  helpText={social.enabled ? `Enter your ${social.platform} page URL` : `Enable ${social.platform} to add URL`}
                />
              </Box>
            </InlineStack>
          ))}
        </BlockStack>
      </BlockStack>
      
      <Divider />
      
      {/* Additional Options */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Additional Options</Text>
        
        <Checkbox
          label="Show Ask Me Later link"
          checked={communityConfig.showAskMeLater}
          onChange={(checked) => setCommunityConfig({ ...communityConfig, showAskMeLater: checked })}
          helpText="Allow users to dismiss the popup temporarily"
        />
        
        {communityConfig.showAskMeLater && (
          <TextField
            label="Ask Me Later Text"
            value={communityConfig.askMeLaterText}
            onChange={(value) => setCommunityConfig({ ...communityConfig, askMeLaterText: value })}
            placeholder="Text for the ask me later link"
            helpText="Text shown for the temporary dismiss option"
          />
        )}
      </BlockStack>
    </BlockStack>
  );

  // ============================================================================
  // COMMUNITY POPUP STYLE FIELDS
  // ============================================================================
  
  const renderCommunityStyleFields = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">🎨 Community Style</Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Customize the visual appearance and layout of your community popup
      </Text>
      
      <Divider />
      
      {/* Colors */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Colors</Text>
        
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
      </BlockStack>
      
      <Divider />
      
      {/* Layout */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Layout</Text>
        
        <RangeSlider
          label={`Border Radius: ${communityConfig.borderRadius}px`}
          value={communityConfig.borderRadius}
          onChange={(value) => setCommunityConfig({ ...communityConfig, borderRadius: value })}
          min={0}
          max={20}
          step={1}
          helpText="Roundness of popup corners"
        />
      </BlockStack>
    </BlockStack>
  );

  // ============================================================================
  // TIMER POPUP CONTENT FIELDS
  // ============================================================================
  
  const renderTimerContentFields = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">📝 Timer Content</Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Configure all text content and timer settings for your countdown popup
      </Text>
      
      <Divider />
      
      {/* Main Content */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Main Content</Text>
        
        <TextField
          label="Popup Title"
          value={timerConfig.title}
          onChange={(value) => setTimerConfig({ ...timerConfig, title: value })}
          placeholder="Enter popup title (e.g., LIMITED TIME OFFER!)"
          helpText="Main headline that creates urgency"
        />
        
        <TextField
          label="Description"
          value={timerConfig.description}
          onChange={(value) => setTimerConfig({ ...timerConfig, description: value })}
          multiline={3}
          placeholder="Enter popup description"
          helpText="Supporting text that explains the limited-time offer"
        />
        
        <TextField
          label="Disclaimer Text"
          value={timerConfig.disclaimer}
          onChange={(value) => setTimerConfig({ ...timerConfig, disclaimer: value })}
          placeholder="Limited time offer. Valid while supplies last."
          helpText="Small print text shown at bottom of popup"
        />
      </BlockStack>
      
      <Divider />
      
      {/* Timer Configuration */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Timer Configuration</Text>
        
        <InlineStack gap="400">
          <Box minWidth="120px">
            <TextField
              label="Days"
              type="number"
              value={timerConfig.timerDays.toString()}
              onChange={(value) => setTimerConfig({ ...timerConfig, timerDays: parseInt(value) || 0 })}
              min={0}
              max={365}
              helpText="Number of days"
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
              helpText="Number of hours"
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
              helpText="Number of minutes"
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
              helpText="Number of seconds"
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
              helpText="Emoji or icon to display with timer"
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
      </BlockStack>
      
      <Divider />
      
      {/* Form Elements */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Form Elements</Text>
        
        <TextField
          label="Email Placeholder"
          value={timerConfig.placeholder}
          onChange={(value) => setTimerConfig({ ...timerConfig, placeholder: value })}
          placeholder="Email input placeholder"
          helpText="Placeholder text for the email input field"
        />
        
        <TextField
          label="Button Text"
          value={timerConfig.buttonText}
          onChange={(value) => setTimerConfig({ ...timerConfig, buttonText: value })}
          placeholder="Button text (e.g., CLAIM OFFER NOW)"
          helpText="Text displayed on the submit button"
        />
        
        <TextField
          label="Discount Code"
          value={timerConfig.discountCode}
          onChange={(value) => setTimerConfig({ ...timerConfig, discountCode: value })}
          placeholder="Discount code to offer"
          helpText="The discount code customers will receive"
        />
      </BlockStack>
      
      <Divider />
      
      {/* Success State */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Success State</Text>
        
        <TextField
          label="Success Title"
          value={timerConfig.successTitle}
          onChange={(value) => setTimerConfig({ ...timerConfig, successTitle: value })}
          placeholder="SUCCESS!"
          helpText="Title shown when user submits email"
        />
        
        <TextField
          label="Success Message"
          value={timerConfig.successMessage}
          onChange={(value) => setTimerConfig({ ...timerConfig, successMessage: value })}
          multiline={2}
          placeholder="Message to show when user submits email"
          helpText="Message displayed after successful email submission"
        />
      </BlockStack>
      
      {timerConfig.onExpiration === "show_expired" && (
        <>
          <Divider />
          
          {/* Expired State */}
          <BlockStack gap="300">
            <Text as="h4" variant="headingSm">Expired State</Text>
            
            <TextField
              label="Expired Title"
              value={timerConfig.expiredTitle}
              onChange={(value) => setTimerConfig({ ...timerConfig, expiredTitle: value })}
              placeholder="OFFER EXPIRED"
              helpText="Title shown when timer expires"
            />
            
            <TextField
              label="Expired Message"
              value={timerConfig.expiredMessage}
              onChange={(value) => setTimerConfig({ ...timerConfig, expiredMessage: value })}
              multiline={3}
              placeholder="Message to show when timer expires"
              helpText="Message displayed when the countdown reaches zero"
            />
            
            <InlineStack gap="400">
              <Box minWidth="120px">
                <TextField
                  label="Expired Icon"
                  value={timerConfig.expiredIcon}
                  onChange={(value) => setTimerConfig({ ...timerConfig, expiredIcon: value })}
                  placeholder="⏰"
                  helpText="Icon for expired state"
                />
              </Box>
              <Box minWidth="200px">
                <TextField
                  label="Expired Button Text"
                  value={timerConfig.expiredButtonText}
                  onChange={(value) => setTimerConfig({ ...timerConfig, expiredButtonText: value })}
                  placeholder="CONTINUE SHOPPING"
                  helpText="Button text in expired state"
                />
              </Box>
            </InlineStack>
          </BlockStack>
        </>
      )}
    </BlockStack>
  );

  // ============================================================================
  // TIMER POPUP STYLE FIELDS
  // ============================================================================
  
  const renderTimerStyleFields = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">🎨 Timer Style</Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Customize the visual appearance and layout of your timer popup
      </Text>
      
      <Divider />
      
      {/* Background & Colors */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Background & Colors</Text>
        
        <TextField
          label="Background Gradient/Color"
          value={timerConfig.backgroundColor}
          onChange={(value) => setTimerConfig({ ...timerConfig, backgroundColor: value })}
          placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          helpText="CSS gradient or solid color for popup background"
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
      </BlockStack>
      
      <Divider />
      
      {/* Layout */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Layout</Text>
        
        <RangeSlider
          label={`Border Radius: ${timerConfig.borderRadius}px`}
          value={timerConfig.borderRadius}
          onChange={(value) => setTimerConfig({ ...timerConfig, borderRadius: value })}
          min={0}
          max={30}
          step={1}
          helpText="Roundness of popup corners"
        />
      </BlockStack>
    </BlockStack>
  );

  // ============================================================================
  // SCRATCH CARD POPUP CONTENT FIELDS
  // ============================================================================
  
  const renderScratchCardContentFields = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">📝 Scratch Card Content</Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Configure all text content and scratch card settings for your interactive popup
      </Text>
      
      <Divider />
      
      {/* Main Content */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Main Content</Text>
        
        <TextField
          label="Popup Title"
          value={scratchCardConfig.title}
          onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, title: value })}
          placeholder="Enter popup title (e.g., Scratch & Win!)"
          helpText="Main headline that encourages interaction"
        />
        
        <TextField
          label="Description"
          value={scratchCardConfig.description}
          onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, description: value })}
          multiline={3}
          placeholder="Enter popup description"
          helpText="Instructions on how to use the scratch card"
        />
      </BlockStack>
      
      <Divider />
      
      {/* Scratch Card Configuration */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Scratch Card Configuration</Text>
        
        <TextField
          label="Discount Percentage"
          type="number"
          value={scratchCardConfig.scratchDiscountPercentage.toString()}
          onChange={(value) => {
            const percentage = parseInt(value) || 15;
            const clampedPercentage = Math.min(Math.max(percentage, 1), 100);
            setScratchCardConfig({ ...scratchCardConfig, scratchDiscountPercentage: clampedPercentage });
          }}
          min={1}
          max={100}
          suffix="%"
          placeholder="15"
          helpText="Set the exact discount percentage customers will receive (1-100%)"
        />
        
        <TextField
          label="Discount Code"
          value={scratchCardConfig.discountCode}
          onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, discountCode: value })}
          placeholder="Discount code to offer (e.g., SCRATCH10)"
          helpText="The discount code customers will receive after scratching"
        />
      </BlockStack>
      
      <Divider />
      
      {/* Form Elements */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Form Elements</Text>
        
        <TextField
          label="Email Placeholder"
          value={scratchCardConfig.placeholder}
          onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, placeholder: value })}
          placeholder="Email input placeholder"
          helpText="Placeholder text for the email input field"
        />
        
        <TextField
          label="Button Text"
          value={scratchCardConfig.buttonText}
          onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, buttonText: value })}
          placeholder="Button text (e.g., CLAIM DISCOUNT)"
          helpText="Text displayed on the submit button"
        />
      </BlockStack>
      
      <Divider />
      
      {/* Scratch Card Features Info */}
      <Box padding="400" background="bg-surface-secondary" borderRadius="200">
        <BlockStack gap="200">
          <Text as="h4" variant="headingSm">
            🎲 Scratch Card Features:
          </Text>
          <BlockStack gap="100">
            <Text variant="bodyMd" as="p" tone="subdued">
              • Interactive canvas-based scratch effect
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              • Configurable discount percentage (you control the exact amount)
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              • Touch and mouse support for all devices
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              • Email validation with terms agreement checkbox
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              • Automatic discount code generation
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              • Dynamic color themes based on discount value
            </Text>
          </BlockStack>
        </BlockStack>
      </Box>
    </BlockStack>
  );

  // ============================================================================
  // SCRATCH CARD POPUP STYLE FIELDS
  // ============================================================================
  
  const renderScratchCardStyleFields = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">🎨 Scratch Card Style</Text>
      <Text as="p" variant="bodyMd" tone="subdued">
        Customize the visual appearance and layout of your scratch card popup
      </Text>
      
      <Divider />
      
      {/* Colors */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Colors</Text>
        
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
      </BlockStack>
      
      <Divider />
      
      {/* Layout */}
      <BlockStack gap="300">
        <Text as="h4" variant="headingSm">Layout</Text>
        
        <RangeSlider
          label={`Border Radius: ${scratchCardConfig.borderRadius}px`}
          value={scratchCardConfig.borderRadius}
          onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, borderRadius: value })}
          min={0}
          max={30}
          step={1}
          helpText="Roundness of popup corners"
        />
      </BlockStack>
    </BlockStack>
  );

  // ============================================================================
  // LEGACY CONFIGURATION RENDERERS (TO BE REMOVED)
  // ============================================================================
  
  // Renders configuration options for the spinning wheel + email capture combo
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
      
      <Text as="h4" variant="headingSm">House Rules</Text>
      <Checkbox
        label="Show house rules section"
        checked={wheelEmailConfig.showHouseRules}
        onChange={(checked) => setWheelEmailConfig({ ...wheelEmailConfig, showHouseRules: checked })}
        helpText="Display rules and terms at the bottom of the popup"
      />
      
      {wheelEmailConfig.showHouseRules && (
        <BlockStack gap="200">
          {wheelEmailConfig.houseRules.map((rule, index) => (
            <InlineStack key={index} gap="200" align="center">
              <Box minWidth="400px">
                <TextField
                  value={rule}
                  onChange={(value) => {
                    const newRules = [...wheelEmailConfig.houseRules];
                    newRules[index] = value;
                    setWheelEmailConfig({ ...wheelEmailConfig, houseRules: newRules });
                  }}
                  placeholder={`House rule ${index + 1}`}
                />
              </Box>
              <Button
                onClick={() => {
                  const newRules = wheelEmailConfig.houseRules.filter((_, i) => i !== index);
                  setWheelEmailConfig({ ...wheelEmailConfig, houseRules: newRules });
                }}
                variant="plain"
                tone="critical"
                disabled={wheelEmailConfig.houseRules.length <= 1}
              >
                Remove
              </Button>
            </InlineStack>
          ))}
          <Button
            onClick={() => {
              const newRules = [...wheelEmailConfig.houseRules, ""];
              setWheelEmailConfig({ ...wheelEmailConfig, houseRules: newRules });
            }}
            variant="plain"
          >
            Add Rule
          </Button>
        </BlockStack>
      )}
      
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

  // ============================================================================
  // COMMUNITY SOCIAL POPUP CONFIGURATION RENDERER
  // ============================================================================
  
  // Renders configuration options for social media follow popups
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

  // ============================================================================
  // TIMER COUNTDOWN POPUP CONFIGURATION RENDERER
  // ============================================================================
  
  // Renders configuration options for countdown timer popups
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

  // ============================================================================
  // SCRATCH CARD POPUP CONFIGURATION RENDERER
  // ============================================================================
  
  // Renders configuration options for interactive scratch card popups
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
        value={scratchCardConfig.discountCode}
        onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, discountCode: value })}
        placeholder="Discount code to offer (e.g., SCRATCH10)"
      />
      
      <TextField
        label="Discount Percentage"
        type="number"
        value={scratchCardConfig.scratchDiscountPercentage.toString()}
        onChange={(value) => {
          const percentage = parseInt(value) || 15;
          const clampedPercentage = Math.min(Math.max(percentage, 1), 100);
          setScratchCardConfig({ ...scratchCardConfig, scratchDiscountPercentage: clampedPercentage });
        }}
        min={1}
        max={100}
        suffix="%"
        placeholder="15"
        helpText="Set the exact discount percentage customers will receive (1-100%)"
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
        onChange={(value) => setScratchCardConfig({ ...scratchCardConfig, frequency: value })}
        helpText="Control how often the popup appears to the same visitor"
      />
      
      <Checkbox
        label="Enable exit intent detection"
        checked={scratchCardConfig.exitIntent}
        onChange={(checked) => setScratchCardConfig({ ...scratchCardConfig, exitIntent: checked })}
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
      
      <Box padding="400" background="bg-surface-secondary" borderRadius="200">
        <BlockStack gap="200">
          <Text as="h4" variant="headingSm">
            🎲 Scratch Card Features:
          </Text>
          <BlockStack gap="100">
            <Text variant="bodyMd" as="p" tone="subdued">
              • Interactive canvas-based scratch effect
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              • Configurable discount percentage (you control the exact amount)
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              • Touch and mouse support for all devices
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              • Email validation with terms agreement checkbox
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              • Automatic discount code generation
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              • Dynamic color themes based on discount value
            </Text>
          </BlockStack>
        </BlockStack>
      </Box>
    </BlockStack>
  );

  // ============================================================================
  // PAGE TARGETING CONFIGURATION RENDERER
  // ============================================================================
  
  // Renders the page targeting interface for controlling where popups appear
  const renderPageTargeting = () => {
    const allPages = [
      ...storefrontPages.staticPages,
      ...storefrontPages.collections,
      ...storefrontPages.products,
      ...storefrontPages.pages
    ];

    return (
      <BlockStack gap="400">
        <Text as="h4" variant="headingSm">Page Targeting</Text>
        <Text as="p" variant="bodyMd" tone="subdued">
          Choose where this popup should appear on your storefront
        </Text>
        
        <ChoiceList
          title="Display Options"
          choices={[
            {
              label: 'Show on all pages',
              value: 'all',
              helpText: 'Display this popup on every page of your store'
            },
            {
              label: 'Show on specific pages only',
              value: 'specific',
              helpText: 'Choose specific pages where this popup should appear'
            }
          ]}
          selected={pageTargeting.targetAllPages ? ['all'] : ['specific']}
          onChange={(selected) => {
            const isAllPages = selected.includes('all');
            setPageTargeting({
              ...pageTargeting,
              targetAllPages: isAllPages,
              targetSpecificPages: !isAllPages,
              selectedPages: isAllPages ? [] : pageTargeting.selectedPages
            });
          }}
        />

        {pageTargeting.targetSpecificPages && (
          <BlockStack gap="300">
            <Text as="h4" variant="headingSm">Select Pages</Text>
            
            {pagesLoading ? (
              <Box padding="400">
                <Text as="p" variant="bodyMd" alignment="center">Loading pages...</Text>
              </Box>
            ) : (
              <BlockStack gap="200">
                {/* Static Pages */}
                {storefrontPages.staticPages.length > 0 && (
                  <BlockStack gap="200">
                    <Text as="h5" variant="headingXs" tone="subdued">Store Pages</Text>
                    {storefrontPages.staticPages.map(page => (
                      <Checkbox
                        key={page.value}
                        label={page.label}
                        checked={pageTargeting.selectedPages.some(p => p.value === page.value)}
                        onChange={(checked) => {
                          if (checked) {
                            setPageTargeting({
                              ...pageTargeting,
                              selectedPages: [...pageTargeting.selectedPages, page]
                            });
                          } else {
                            setPageTargeting({
                              ...pageTargeting,
                              selectedPages: pageTargeting.selectedPages.filter(p => p.value !== page.value)
                            });
                          }
                        }}
                      />
                    ))}
                  </BlockStack>
                )}

                {/* Collections */}
                {storefrontPages.collections.length > 0 && (
                  <BlockStack gap="200">
                    <Text as="h5" variant="headingXs" tone="subdued">Collections</Text>
                    {storefrontPages.collections.slice(0, 10).map(page => (
                      <Checkbox
                        key={page.value}
                        label={page.label}
                        checked={pageTargeting.selectedPages.some(p => p.value === page.value)}
                        onChange={(checked) => {
                          if (checked) {
                            setPageTargeting({
                              ...pageTargeting,
                              selectedPages: [...pageTargeting.selectedPages, page]
                            });
                          } else {
                            setPageTargeting({
                              ...pageTargeting,
                              selectedPages: pageTargeting.selectedPages.filter(p => p.value !== page.value)
                            });
                          }
                        }}
                      />
                    ))}
                    {storefrontPages.collections.length > 10 && (
                      <Text as="p" variant="bodyMd" tone="subdued">
                        And {storefrontPages.collections.length - 10} more collections...
                      </Text>
                    )}
                  </BlockStack>
                )}

                {/* Products */}
                {storefrontPages.products.length > 0 && (
                  <BlockStack gap="200">
                    <Text as="h5" variant="headingXs" tone="subdued">Products</Text>
                    {storefrontPages.products.slice(0, 5).map(page => (
                      <Checkbox
                        key={page.value}
                        label={page.label}
                        checked={pageTargeting.selectedPages.some(p => p.value === page.value)}
                        onChange={(checked) => {
                          if (checked) {
                            setPageTargeting({
                              ...pageTargeting,
                              selectedPages: [...pageTargeting.selectedPages, page]
                            });
                          } else {
                            setPageTargeting({
                              ...pageTargeting,
                              selectedPages: pageTargeting.selectedPages.filter(p => p.value !== page.value)
                            });
                          }
                        }}
                      />
                    ))}
                    {storefrontPages.products.length > 5 && (
                      <Text as="p" variant="bodyMd" tone="subdued">
                        And {storefrontPages.products.length - 5} more products...
                      </Text>
                    )}
                  </BlockStack>
                )}

                {/* Custom Pages */}
                {storefrontPages.pages.length > 0 && (
                  <BlockStack gap="200">
                    <Text as="h5" variant="headingXs" tone="subdued">Custom Pages</Text>
                    {storefrontPages.pages.map(page => (
                      <Checkbox
                        key={page.value}
                        label={page.label}
                        checked={pageTargeting.selectedPages.some(p => p.value === page.value)}
                        onChange={(checked) => {
                          if (checked) {
                            setPageTargeting({
                              ...pageTargeting,
                              selectedPages: [...pageTargeting.selectedPages, page]
                            });
                          } else {
                            setPageTargeting({
                              ...pageTargeting,
                              selectedPages: pageTargeting.selectedPages.filter(p => p.value !== page.value)
                            });
                          }
                        }}
                      />
                    ))}
                  </BlockStack>
                )}

                {/* Custom URL Input */}
                <BlockStack gap="200">
                  <Text as="h5" variant="headingXs" tone="subdued">Custom URL</Text>
                  <TextField
                    label="Add custom URL"
                    value={customUrl}
                    onChange={setCustomUrl}
                    placeholder="/custom-page or /collections/special"
                    helpText="Enter a custom URL path (e.g., /about-us, /collections/sale). Use * for wildcards (e.g., /blog/*)"
                    connectedRight={
                      <Button
                        onClick={() => {
                          if (customUrl.trim()) {
                            const customPage = {
                              type: 'custom',
                              label: `Custom: ${customUrl}`,
                              value: customUrl.trim(),
                              url: customUrl.trim()
                            };
                            
                            // Check if URL already exists
                            if (!pageTargeting.selectedPages.some(p => p.value === customUrl.trim())) {
                              setPageTargeting({
                                ...pageTargeting,
                                selectedPages: [...pageTargeting.selectedPages, customPage]
                              });
                              setCustomUrl('');
                            }
                          }
                        }}
                        disabled={!customUrl.trim()}
                      >
                        Add
                      </Button>
                    }
                  />
                </BlockStack>

                {pageTargeting.selectedPages.length > 0 && (
                  <Box padding="300" background="bg-surface-secondary" borderRadius="200">
                    <Text as="p" variant="bodyMd">
                      <strong>Selected pages ({pageTargeting.selectedPages.length}):</strong>
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {pageTargeting.selectedPages.map(p => p.label).join(', ')}
                    </Text>
                    <BlockStack gap="100">
                      {pageTargeting.selectedPages.map((page, index) => (
                        <InlineStack key={index} align="space-between">
                          <Text variant="bodySm">{page.label}</Text>
                          <Button
                            size="micro"
                            onClick={() => {
                              setPageTargeting({
                                ...pageTargeting,
                                selectedPages: pageTargeting.selectedPages.filter((_, i) => i !== index)
                              });
                            }}
                          >
                            Remove
                          </Button>
                        </InlineStack>
                      ))}
                    </BlockStack>
                  </Box>
                )}
              </BlockStack>
            )}
          </BlockStack>
        )}
      </BlockStack>
    );
  };

  // ============================================================================
  // LIVE PREVIEW PANEL RENDERER
  // ============================================================================
  
  // Renders the live preview panel showing real-time popup appearance
  const renderPreviewPanel = () => {
    const config = getCurrentConfig();
    const badgeText = popupType === "email" ? "Email Popup" :
                      popupType === "community" ? "Community Social Popup" :
                      popupType === "timer" ? "Timer Countdown Popup" :
                      popupType === "scratch-card" ? "Scratch Card Popup" :
                      "Wheel + Email Combo";
    
    // Device preview tabs
    const deviceTabs = [
      {
        id: 'desktop',
        content: '🖥️ Desktop',
        accessibilityLabel: 'Desktop preview',
        panelID: 'desktop-preview',
      },
      {
        id: 'mobile',
        content: '📱 Mobile',
        accessibilityLabel: 'Mobile preview',
        panelID: 'mobile-preview',
      },
    ];

    // Get active device tab index
    const activeDeviceTab = previewDevice === 'desktop' ? 0 : 1;

    // Get device-specific styles
    const getDeviceStyles = () => {
      const baseStyles = {
        margin: '0 auto',
        transition: 'all 0.3s ease',
      };

      if (previewDevice === 'mobile') {
        // Mobile-specific dimensions matching actual storefront responsive behavior
        const mobileMaxWidths = {
          'email': '95vw', // From popup-styles.css @media (max-width: 480px)
          'wheel-email': '98vw', // From popup-styles.css wheel mobile responsive
          'community': '95vw', // Community popup mobile
          'timer': '98vw', // From popup-styles.css timer mobile
          'scratch-card': '98vw' // From popup-styles.css scratch card mobile
        };

        const mobileTransforms = {
          'email': 'scale(0.85)', // Email popup mobile scaling
          'wheel-email': 'scale(0.7)', // Wheel needs more compression due to complex layout
          'community': 'scale(0.85)', // Community popup mobile scaling
          'timer': 'scale(1.0)', // Timer is already compact, no additional scaling needed
          'scratch-card': 'scale(0.75)' // Scratch card has step indicators, needs more compression
        };

        return {
          ...baseStyles,
          maxWidth: mobileMaxWidths[popupType] || '95vw',
          width: '100%',
          transform: mobileTransforms[popupType] || 'scale(0.85)',
          transformOrigin: 'center',
        };
      }

      // Desktop styles - type-specific dimensions matching actual storefront popup.js and PopupPreview.jsx
      const desktopMaxWidths = {
        'email': '600px', // From popup.js email popup maxWidth
        'wheel-email': '700px', // From popup.js wheel popup maxWidth (lines 737-738)
        'community': '400px', // From popup.js community popup maxWidth (line 449)
        'timer': '420px', // From popup.js timer popup maxWidth (line 653)
        'scratch-card': '800px' // From popup.js scratch card responsive maxWidth (line 694)
      };

      const desktopWidths = {
        'email': '100%',
        'wheel-email': '100%', // Wheel popup needs some margin
        'community': '100%',
        'timer': '100%', // Timer popup responsive width
        'scratch-card': '100%'
      };

      return {
        ...baseStyles,
        maxWidth: desktopMaxWidths[popupType] || '600px',
        width: desktopWidths[popupType] || '100%',
      };
    };

    // Get mobile preview-specific styles for each popup type
    const getMobilePreviewStyles = () => {
      const baseStyles = {
        width: '100%',
        margin: '0 auto',
        transformOrigin: 'center',
      };

      // Mobile preview styles based on reference screenshots
      const mobilePreviewConfig = {
        'email': {
          maxWidth: '280px',
          transform: 'scale(0.85)',
        },
        'wheel-email': {
          maxWidth: '290px',
          transform: 'scale(0.75)', // Wheel needs more space, smaller scale
        },
        'community': {
          maxWidth: '275px',
          transform: 'scale(0.85)',
        },
        'timer': {
          maxWidth: '95vw', // From popup-styles.css timer mobile responsive
          transform: 'scale(1.0)', // Timer is already compact, no additional scaling needed
        },
        'scratch-card': {
          maxWidth: '285px',
          transform: 'scale(0.8)', // Scratch card needs space for steps
        }
      };

      console.log("PopupType for ---------------- _------------ " + popupType)
      const config = mobilePreviewConfig[popupType] || mobilePreviewConfig['email'];

      return {
        ...baseStyles,
        ...config,
      };
    };

    // Get container styles based on device
    const getContainerStyles = () => {
      if (previewDevice === 'mobile') {
        return {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '600px',
          padding: '20px',
        };
      }
      
      return {};
    };

    // Mobile phone frame component - matches actual storefront mobile behavior
    const renderMobileFrame = (children) => {
      // Get mobile-specific styling based on popup type from actual storefront CSS
      const getMobileFrameStyles = () => {
        const baseStyles = {
          width: '100%',
          maxWidth: '280px',
          transformOrigin: 'center',
        };

        // Mobile frame scaling based on actual popup-styles.css responsive breakpoints
        switch (popupType) {
          case 'email':
            return {
              ...baseStyles,
              maxWidth: '280px', // Fixed mobile frame width
              transform: 'scale(0.9)', // Slightly larger for better visibility
            };
          
          case 'wheel-email':
            return {
              ...baseStyles,
              maxWidth: '280px', // Fixed mobile frame width
              transform: 'scale(0.65)', // Wheel needs significant compression due to two-panel layout
            };
          
          case 'community':
            return {
              ...baseStyles,
              maxWidth: '280px', // Fixed mobile frame width
              transform: 'scale(0.85)', // Community popup is compact
            };
          
          case 'timer':
            return {
              ...baseStyles,
              maxWidth: '280px', // Fixed mobile frame width
              transform: 'scale(0.8)', // Timer needs some compression for mobile frame
            };
          
          case 'scratch-card':
            return {
              ...baseStyles,
              maxWidth: '280px', // Fixed mobile frame width
              transform: 'scale(0.7)', // Scratch card has step indicators and two-panel layout
            };
          
          default:
            return {
              ...baseStyles,
              maxWidth: '280px',
              transform: 'scale(0.8)',
            };
        }
      };

      return (
        <div style={{
          width: '320px',
          height: '568px',
          background: '#1a1a1a',
          borderRadius: '36px',
          padding: '20px 8px',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 2px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 auto',
        }}>
          {/* Phone screen */}
          <div style={{
            width: '100%',
            height: '100%',
            background: '#f5f5f5',
            borderRadius: '28px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Status bar */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '16px',
              right: '16px',
              height: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: '#000',
              zIndex: 20,
            }}>
              <span>4:49</span>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px' }}>📶 📶 ▲ 📶 🔋 46%</span>
              </div>
            </div>
            
            {/* Browser bar */}
            <div style={{
              position: 'absolute',
              top: '35px',
              left: '8px',
              right: '8px',
              height: '40px',
              background: '#2d2d2d',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              zIndex: 20,
            }}>
              <div style={{
                background: '#4a4a4a',
                borderRadius: '12px',
                padding: '6px 12px',
                fontSize: '11px',
                color: '#ccc',
                flex: 1,
                textAlign: 'center',
              }}>
                🔒 opmentst.myshopify.com
              </div>
            </div>
            
            {/* Home indicator */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '134px',
              height: '5px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '3px',
              zIndex: 20,
            }}></div>
            
            {/* Website background */}
            <div style={{
              position: 'absolute',
              top: '85px',
              left: '0',
              right: '0',
              bottom: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              opacity: 0.3,
            }}></div>
            
            {/* Popup overlay area */}
            <div style={{
              position: 'absolute',
              top: '85px',
              left: '0',
              right: '0',
              bottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 12px',
              zIndex: 10,
            }}>
              {/* Popup container with mobile-specific styling matching storefront behavior */}
              <div style={getMobileFrameStyles()}>
                {children}
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    return (
      <div className="timer-preview-container">
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="h3" variant="headingMd">Live Preview</Text>
              <Badge tone="info">{badgeText}</Badge>
            </InlineStack>
            
            {/* Device Preview Toggle */}
            <Box>
              <Tabs
                tabs={deviceTabs}
                selected={activeDeviceTab}
                onSelect={(selectedTabIndex) => {
                  setPreviewDevice(selectedTabIndex === 0 ? 'desktop' : 'mobile');
                }}
              >
                <Box padding="0">
                  {/* Tab content is handled below in the preview box */}
                </Box>
              </Tabs>
            </Box>
            
            <Box
              padding="400"
              background={previewDevice === 'mobile' ? 'bg-surface' : 'bg-surface-secondary'}
              borderRadius="200"
              borderWidth="025"
              borderColor="border"
              style={getContainerStyles()}
            >
              {previewDevice === 'mobile' ? (
                renderMobileFrame(
                  <PopupPreview
                    config={config}
                    type={popupType}
                    disableInteractions={true}
                    style={getMobilePreviewStyles()}
                    deviceView={previewDevice}
                  />
                )
              ) : (
                <PopupPreview
                  config={config}
                  type={popupType}
                  disableInteractions={true}
                  style={getDeviceStyles()}
                  deviceView={previewDevice}
                />
              )}
            </Box>

            {/* Device Info */}
            <Box padding="200" background="bg-surface-secondary" borderRadius="200">
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                {previewDevice === 'desktop'
                  ? '🖥️ Desktop view - Full-size popup display'
                  : '📱 Mobile view - Responsive mobile layout'
                }
              </Text>
            </Box>
          </BlockStack>
        </Card>
      </div>
    );
  };

  // ============================================================================
  // MAIN COMPONENT RENDER
  // ============================================================================
  
  return (
    isOpen && 
  <>
    <style>
      {`
        .custom-overlay-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .custom-modal-content {
          background: white;
          width: 96vw;
          height: 95vh;
          display: flex;
          flex-direction: column;
          border-radius: 12px;
          overflow: hidden;
        }

        .custom-modal-header,
        .custom-modal-footer {
          padding: 16px;
          background-color: #f9fafb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #ddd;
        }

        .custom-modal-footer {
          border-top: 1px solid #ddd;
          border-bottom: none;
        }

        .custom-modal-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .left-panel {
          flex: 1;
          padding: 24px;
          overflow-y: auto;
          background-color: #ffffff;
        }

        .right-panel {
          width: 50%;
          min-width: 500px;
          max-width: 1100px;
          background-color: #f3f4f6;
          padding: 24px;
          overflow-y: auto;
          border-left: 1px solid #ddd;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          font-size: 20px;
          cursor: pointer;
        }

        .action-btn {
          padding: 10px 20px;
          font-weight: bold;
          border-radius: 4px;
          border: none;
          cursor: pointer;
        }

        .save-btn {
          background-color: #008060;
          color: white;
        }

        .cancel-btn {
          background-color: #e0e0e0;
          margin-right: 12px;
        }
      `}
    </style>

    <div className="custom-overlay-modal">
      <div className="custom-modal-content">

        {/* Header */}
        <div className="custom-modal-header">
          <h2>Popup Configuration</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="custom-modal-body">
          {/* Left Panel: Configuration */}
          <div className="left-panel">
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Popup Configuration
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Customize your popup to engage visitors and boost conversions.
                  </Text>
                </BlockStack>

                <Divider />

                {/* Tabs */}
                <Box width="100%">
                  <Tabs tabs={tabs} selected={activeTab} onSelect={setActiveTab}>
                    <Box padding="400">
                      <BlockStack gap="400">
                        <TextField
                          label="Popup Name"
                          value={popupName}
                          onChange={(value) => {
                            const trimmedValue = value.slice(0, 50);
                            setPopupName(trimmedValue);
                            setTimeout(() => validatePopupName(trimmedValue), 300);
                          }}
                          onBlur={() => validatePopupName(popupName)}
                          placeholder={`${popupType.charAt(0).toUpperCase() + popupType.slice(1)} Popup`}
                          maxLength={50}
                          showCharacterCount
                          helpText="Give your popup a descriptive name"
                          error={popupNameError}
                        />
                        <Divider />

                        {/* Tab Content */}
                        {activeTab === 0 && renderRulesSection()}
                        {activeTab === 1 && renderContentSection()}
                        {activeTab === 2 && renderStyleSection()}
                      </BlockStack>
                    </Box>
                  </Tabs>
                </Box>
              </BlockStack>
            </Card>
          </div>

          {/* Right Panel: Preview */}
          <div className="right-panel">
            {renderPreviewPanel()}
          </div>
        </div>

        {/* Footer */}
        <div className="custom-modal-footer">
          <div>
            <Button variant="primary" className="action-btn cancel-btn" onClick={onClose}>Cancel</Button>
          </div>
          <div>
            <Button
              variant="primary"
              className="action-btn save-btn"
              onClick={handleSaveConfig}
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting" ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </>


  );
}