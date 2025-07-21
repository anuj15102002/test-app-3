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
} from "@shopify/polaris";
import { EmailIcon, ClockIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import "../styles/timer-popup-modal.css";

/**
 * PopupConfigurationModal - Universal modal that contains the entire popup customizer interface
 * 
 * Features:
 * - Two-panel layout (Configuration + Live Preview)
 * - Supports all popup types (email, wheel-email, community, timer)
 * - Real-time configuration updates
 * - Shopify-like UX with Polaris components
 * - Mobile responsive design
 */
export default function PopupConfigurationModal({
  isOpen,
  onClose,
  initialConfig = null,
  initialPopupType = "wheel-email",
  initialPopupName = ""
}) {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  
  // Initialize popup type from props or default
  const [popupType, setPopupType] = useState(initialPopupType);
  
  // Popup name state - use initialPopupName for new popups, initialConfig.name for editing
  const [popupName, setPopupName] = useState(initialConfig?.name || initialPopupName || "");
  
  // Page targeting state
  const [pageTargeting, setPageTargeting] = useState(() => {
    if (initialConfig) {
      return {
        targetAllPages: initialConfig.targetAllPages !== false,
        targetSpecificPages: initialConfig.targetSpecificPages || false,
        selectedPages: initialConfig.pageTargeting ? JSON.parse(initialConfig.pageTargeting) : []
      };
    }
    return {
      targetAllPages: true,
      targetSpecificPages: false,
      selectedPages: []
    };
  });
  
  // Storefront pages state
  const [storefrontPages, setStorefrontPages] = useState({
    collections: [],
    products: [],
    pages: [],
    staticPages: []
  });
  const [pagesLoading, setPagesLoading] = useState(false);
  
  // Custom URL state
  const [customUrl, setCustomUrl] = useState('');
  
  // Email popup configuration
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

  // Wheel-Email combo configuration
  const [wheelEmailConfig, setWheelEmailConfig] = useState(() => {
    if (initialConfig && initialConfig.type === "wheel-email") {
      const backgroundColor = initialConfig.backgroundColor || "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)";
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
        subtitle: "AMAZING DISCOUNTS!",
        description: initialConfig.description || "Enter your email below and spin the wheel to see if you're our next lucky winner!",
        placeholder: initialConfig.placeholder || "Your email",
        buttonText: initialConfig.buttonText || "TRY YOUR LUCK",
        discountCode: initialConfig.discountCode || "SAVE5",
        segments: initialConfig.segments ? JSON.parse(initialConfig.segments) : [
          { label: '5% OFF', color: '#ff6b6b', code: 'SAVE5' },
          { label: '10% OFF', color: '#4ecdc4', code: 'SAVE10' },
          { label: '15% OFF', color: '#45b7d1', code: 'SAVE15' },
          { label: '20% OFF', color: '#feca57', code: 'SAVE20' },
          { label: 'FREE SHIPPING', color: '#ff9ff3', code: 'FREESHIP' },
          { label: 'TRY AGAIN', color: '#54a0ff', code: null }
        ],
        backgroundColor: backgroundColor,
        backgroundType: backgroundType,
        textColor: "#ffffff",
        displayDelay: initialConfig.displayDelay || 3000,
        frequency: initialConfig.frequency || "once",
        exitIntent: initialConfig.exitIntent || false,
        exitIntentDelay: initialConfig.exitIntentDelay || 1000,
      };
    }
    return {
      title: "GET YOUR CHANCE TO WIN",
      subtitle: "AMAZING DISCOUNTS!",
      description: "Enter your email below and spin the wheel to see if you're our next lucky winner!",
      placeholder: "Enter your email address",
      buttonText: "TRY YOUR LUCK",
      discountCode: "SAVE10",
      segments: [
        { label: '5% OFF', color: '#ff6b6b', code: 'SAVE5' },
        { label: '10% OFF', color: '#4ecdc4', code: 'SAVE10' },
        { label: '15% OFF', color: '#45b7d1', code: 'SAVE15' },
        { label: '20% OFF', color: '#feca57', code: 'SAVE20' },
        { label: 'FREE SHIPPING', color: '#ff9ff3', code: 'FREESHIP' },
        { label: 'TRY AGAIN', color: '#54a0ff', code: null }
      ],
      backgroundColor: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
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

  // Timer popup configuration
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

  // Scratch card popup configuration
  const [scratchCardConfig, setScratchCardConfig] = useState(() => {
    if (initialConfig && initialConfig.type === "scratch-card") {
      return {
        title: initialConfig.title || "Scratch & Win!",
        description: initialConfig.description || "Scratch the card to reveal your exclusive discount and enter your email to claim it!",
        placeholder: initialConfig.placeholder || "Enter your email",
        buttonText: initialConfig.buttonText || "CLAIM DISCOUNT",
        discountCode: initialConfig.discountCode || "SCRATCH10",
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

  // Fetch storefront pages
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

  // Load storefront pages when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStorefrontPages();
    }
  }, [isOpen, fetchStorefrontPages]);

  // Handle save configuration
  const handleSaveConfig = useCallback(() => {
    const config = popupType === "email" ? emailConfig :
                   popupType === "community" ? communityConfig :
                   popupType === "timer" ? timerConfig :
                   popupType === "scratch-card" ? scratchCardConfig :
                   wheelEmailConfig;
    
    // Generate a default name if not provided
    const finalPopupName = popupName || `${popupType.charAt(0).toUpperCase() + popupType.slice(1)} Popup - ${new Date().toLocaleDateString()}`;
    
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
  }, [popupType, emailConfig, wheelEmailConfig, communityConfig, timerConfig, scratchCardConfig, popupName, pageTargeting, initialConfig, fetcher, onClose]);

  // Handle fetcher response
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

  const popupTypeOptions = [
    { label: "Email Discount Popup", value: "email" },
    { label: "Wheel + Email Combo", value: "wheel-email" },
    { label: "Community Social Popup", value: "community" },
    { label: "Timer Countdown Popup", value: "timer" },
    { label: "Scratch Card Popup", value: "scratch-card" },
  ];

  // Get current config based on popup type
  const getCurrentConfig = () => {
    switch (popupType) {
      case "email": return emailConfig;
      case "community": return communityConfig;
      case "timer": return timerConfig;
      case "scratch-card": return scratchCardConfig;
      default: return wheelEmailConfig;
    }
  };

  // Render configuration panel based on popup type
  const renderConfigurationPanel = () => {
    switch (popupType) {
      case "email":
        return renderEmailConfig();
      case "community":
        return renderCommunityConfig();
      case "timer":
        return renderTimerConfig();
      case "scratch-card":
        return renderScratchCardConfig();
      default:
        return renderWheelEmailConfig();
    }
  };

  // Email popup configuration
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

  // Wheel-Email combo configuration
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

  // Community popup configuration
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

  // Timer popup configuration
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

  // Scratch card popup configuration
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
              • Random discount percentages (5%, 10%, 15%, 20%, 25%, 30%)
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
          </BlockStack>
        </BlockStack>
      </Box>
    </BlockStack>
  );

  // Render page targeting configuration
  const renderPageTargeting = () => {
    const allPages = [
      ...storefrontPages.staticPages,
      ...storefrontPages.collections,
      ...storefrontPages.products,
      ...storefrontPages.pages
    ];

    return (
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">Page Targeting</Text>
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

  // Render preview panel
  const renderPreviewPanel = () => {
    const config = getCurrentConfig();
    const badgeText = popupType === "email" ? "Email Popup" :
                      popupType === "community" ? "Community Social Popup" :
                      popupType === "timer" ? "Timer Countdown Popup" :
                      popupType === "scratch-card" ? "Scratch Card Popup" :
                      "Wheel + Email Combo";
    
    return (
      <div className="timer-preview-container">
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <Text as="h3" variant="headingMd">Live Preview</Text>
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
                  width: "400px",
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
                        ) : popupType === "community" ? (
                          <Text as="span" variant="headingLg">👥</Text>
                        ) : popupType === "timer" ? (
                          <Text as="span" variant="headingLg">{timerConfig.timerIcon}</Text>
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
                      <div style={{ fontSize: "24px", marginBottom: "10px", textAlign: "center" }}>📧</div>
                      <Text as="h4" variant="headingMd" style={{
                        color: config.textColor,
                        textAlign: "center",
                        fontSize: "20px",
                        fontWeight: "600",
                        margin: "0 0 15px 0"
                      }}>
                        {emailConfig.title}
                      </Text>
                      <Text as="p" variant="bodyMd" style={{
                        color: config.textColor,
                        textAlign: "center",
                        marginBottom: "20px",
                        lineHeight: "1.5"
                      }}>
                        {emailConfig.description}
                      </Text>
                      <input
                        type="email"
                        placeholder={emailConfig.placeholder}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #ccc",
                          borderRadius: "6px",
                          marginBottom: "15px",
                          fontSize: "14px",
                          boxSizing: "border-box"
                        }}
                        readOnly
                      />
                      <button
                        style={{
                          width: "100%",
                          backgroundColor: emailConfig.buttonColor,
                          color: "#fff",
                          padding: "12px 24px",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "14px"
                        }}
                      >
                        {emailConfig.buttonText}
                      </button>
                    </BlockStack>
                  ) : popupType === "community" ? (
                    // Community Popup Preview - Exact match with real implementation
                    <div style={{
                      backgroundColor: communityConfig.backgroundColor || '#ffffff',
                      borderRadius: `${communityConfig.borderRadius || 12}px`,
                      overflow: "hidden",
                      maxWidth: "350px",
                      margin: "0 auto",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}>
                      {/* Banner at the very top */}
                      <div
                        style={{
                          width: '100%',
                          height: '100px',
                          backgroundColor: '#f0f0f0',
                          backgroundImage: communityConfig.bannerImage ?
                            `url(${communityConfig.bannerImage})` :
                            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: `${communityConfig.borderRadius || 12}px ${communityConfig.borderRadius || 12}px 0 0`,
                          position: 'relative',
                        }}
                      >
                        {/* Close button positioned over banner */}
                        {communityConfig.showCloseButton && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '20px',
                              height: '20px',
                              backgroundColor: 'rgba(0,0,0,0.3)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '14px',
                              cursor: 'pointer',
                            }}
                          >
                            ×
                          </div>
                        )}
                      </div>
                      
                      {/* Content wrapper with padding */}
                      <div style={{ padding: '20px', textAlign: 'center' }}>
                        {/* Title and Description */}
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '10px'
                          }}>
                            <span style={{ fontSize: '18px' }}>👥</span>
                            <Text as="h3" variant="headingMd" style={{
                              color: communityConfig.textColor || '#000000',
                              margin: '0',
                              fontSize: '16px',
                              fontWeight: '600'
                            }}>
                              {communityConfig.title}
                            </Text>
                          </div>
                          <Text as="p" variant="bodyMd" style={{
                            color: communityConfig.textColor || '#000000',
                            fontSize: '13px',
                            lineHeight: '1.4',
                            margin: '0'
                          }}>
                            {communityConfig.description}
                          </Text>
                        </div>
                        
                        {/* Social Icons with proper colors */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '12px',
                          marginBottom: '20px'
                        }}>
                          {communityConfig.socialIcons.filter(icon => icon.enabled).map((social, index) => {
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
                            
                            return (
                              <div
                                key={social.platform}
                                style={{
                                  width: '35px',
                                  height: '35px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: 'bold',
                                  ...iconStyle,
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                              >
                                {social.platform === 'facebook' ? 'f' :
                                 social.platform === 'instagram' ? '📷' :
                                 social.platform === 'linkedin' ? 'in' :
                                 social.platform === 'x' ? 'X' : '?'}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Ask Me Later Link */}
                        {communityConfig.showAskMeLater && (
                          <div style={{ textAlign: 'center' }}>
                            <a
                              href="#"
                              style={{
                                color: communityConfig.textColor || '#000000',
                                textDecoration: 'underline',
                                fontSize: '13px',
                                opacity: 0.7,
                              }}
                            >
                              {communityConfig.askMeLaterText}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : popupType === "timer" ? (
                    // Timer Popup Preview - Exact match with real implementation
                    <div style={{
                      background: timerConfig.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: `${timerConfig.borderRadius || 16}px`,
                      padding: "20px",
                      color: timerConfig.textColor || '#ffffff',
                      textAlign: "center",
                      maxWidth: "350px",
                      margin: "0 auto"
                    }}>
                      {/* Timer Icon and Title */}
                      <div style={{ marginBottom: "15px" }}>
                        <div style={{ fontSize: "24px", marginBottom: "8px" }}>{timerConfig.timerIcon || '⏰'}</div>
                        <Text as="h4" variant="headingMd" style={{
                          color: timerConfig.textColor || '#ffffff',
                          fontSize: "18px",
                          fontWeight: "600",
                          margin: "0 0 8px 0"
                        }}>
                          {timerConfig.title}
                        </Text>
                        <Text as="p" variant="bodyMd" style={{
                          color: timerConfig.textColor || '#ffffff',
                          fontSize: "12px",
                          opacity: 0.9,
                          lineHeight: "1.4",
                          margin: "0 0 15px 0"
                        }}>
                          {timerConfig.description}
                        </Text>
                      </div>

                      {/* Timer Display */}
                      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
                        {timerConfig.timerDays > 0 && (
                          <div style={{
                            background: "rgba(255,255,255,0.2)",
                            padding: "8px 6px",
                            borderRadius: "6px",
                            minWidth: "40px",
                            textAlign: "center"
                          }}>
                            <div style={{ fontWeight: "bold", fontSize: "16px", color: "white" }}>
                              {timerConfig.timerDays.toString().padStart(2, '0')}
                            </div>
                            <div style={{ opacity: 0.8, fontSize: "10px", color: "white" }}>Days</div>
                          </div>
                        )}
                        <div style={{
                          background: "rgba(255,255,255,0.2)",
                          padding: "8px 6px",
                          borderRadius: "6px",
                          minWidth: "40px",
                          textAlign: "center"
                        }}>
                          <div style={{ fontWeight: "bold", fontSize: "16px", color: "white" }}>
                            {timerConfig.timerHours.toString().padStart(2, '0')}
                          </div>
                          <div style={{ opacity: 0.8, fontSize: "10px", color: "white" }}>Hours</div>
                        </div>
                        <div style={{
                          background: "rgba(255,255,255,0.2)",
                          padding: "8px 6px",
                          borderRadius: "6px",
                          minWidth: "40px",
                          textAlign: "center"
                        }}>
                          <div style={{ fontWeight: "bold", fontSize: "16px", color: "white" }}>
                            {timerConfig.timerMinutes.toString().padStart(2, '0')}
                          </div>
                          <div style={{ opacity: 0.8, fontSize: "10px", color: "white" }}>Minutes</div>
                        </div>
                        <div style={{
                          background: "rgba(255,255,255,0.2)",
                          padding: "8px 6px",
                          borderRadius: "6px",
                          minWidth: "40px",
                          textAlign: "center"
                        }}>
                          <div style={{ fontWeight: "bold", fontSize: "16px", color: "white" }}>
                            {timerConfig.timerSeconds.toString().padStart(2, '0')}
                          </div>
                          <div style={{ opacity: 0.8, fontSize: "10px", color: "white" }}>Seconds</div>
                        </div>
                      </div>

                      {/* Form */}
                      <div style={{ marginBottom: "15px" }}>
                        <input
                          type="email"
                          placeholder={timerConfig.placeholder}
                          style={{
                            width: "100%",
                            padding: "12px",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            boxSizing: "border-box",
                            marginBottom: "12px"
                          }}
                          readOnly
                        />
                        <button
                          style={{
                            width: "100%",
                            backgroundColor: "#ff6b6b",
                            color: "#fff",
                            padding: "12px 20px",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "14px",
                            textTransform: "uppercase"
                          }}
                        >
                          {timerConfig.buttonText}
                        </button>
                      </div>

                      {/* Disclaimer */}
                      <div style={{
                        fontSize: "10px",
                        color: "rgba(255, 255, 255, 0.6)",
                        fontStyle: "italic"
                      }}>
                        {timerConfig.disclaimer}
                      </div>
                    </div>
                  ) : popupType === "scratch-card" ? (
                    // Scratch Card Preview - Exact match with real implementation
                    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", padding: "20px" }}>
                      {/* Left side - Scratch Card */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ position: "relative", marginBottom: "10px" }}>
                          {/* Scratch Canvas Preview */}
                          <div
                            style={{
                              width: "120px",
                              height: "120px",
                              background: "linear-gradient(135deg, #4A90E2 0%, #5BA0F2 100%)",
                              borderRadius: "8px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: "12px",
                              fontWeight: "bold",
                              textAlign: "center",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <div>SCRATCH</div>
                            <div>HERE</div>
                            <div style={{ fontSize: "16px", marginTop: "5px" }}>✋</div>
                            
                            {/* Hidden discount preview */}
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: 0.2,
                                fontSize: "24px",
                                fontWeight: "900",
                                color: "white"
                              }}
                            >
                              <div>20%</div>
                              <div style={{ fontSize: "12px" }}>OFF</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: "10px", color: config.textColor, textAlign: "center", fontStyle: "italic" }}>
                          Enter email to start scratching!
                        </div>
                      </div>
                      
                      {/* Right side - Form */}
                      <div style={{ flex: 1 }}>
                        <Text as="h4" variant="headingMd" style={{
                          color: config.textColor,
                          fontSize: "18px",
                          fontWeight: "600",
                          margin: "0 0 10px 0"
                        }}>
                          {scratchCardConfig.title}
                        </Text>
                        <Text as="p" variant="bodyMd" style={{
                          color: config.textColor,
                          fontSize: "12px",
                          marginBottom: "15px",
                          lineHeight: "1.4"
                        }}>
                          {scratchCardConfig.description}
                        </Text>
                        
                        <div style={{ marginBottom: "10px" }}>
                          <input
                            type="email"
                            placeholder={scratchCardConfig.placeholder}
                            style={{
                              width: "100%",
                              padding: "8px",
                              border: "1px solid #ccc",
                              borderRadius: "4px",
                              fontSize: "12px",
                              boxSizing: "border-box"
                            }}
                            readOnly
                          />
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", fontSize: "10px" }}>
                          <input type="checkbox" style={{ width: "12px", height: "12px" }} />
                          <span style={{ color: config.textColor }}>I agree to receive promotional emails</span>
                        </div>
                        
                        <button
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            background: "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)",
                            border: "none",
                            borderRadius: "4px",
                            color: "white",
                            fontSize: "11px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            textTransform: "uppercase",
                            opacity: 0.6
                          }}
                        >
                          Enable Scratching
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Wheel-Email Combo Preview
                    <div
                      style={{
                        background: wheelEmailConfig.backgroundColor || "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
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

            {/* Preview Tips */}
            <Card sectioned>
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">Preview Tips</Text>
                <BlockStack gap="100">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    • Changes update instantly in preview
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    • Test different configurations for optimal results
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    • Mobile responsive design included
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    • Save to apply changes to your storefront
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Card>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          .Polaris-Modal-Dialog--sizeFullScreen {
            max-width: 95vw !important;
            width: 95vw !important;
            margin: 2.5vw auto !important;
          }
          .Polaris-Modal-Dialog--sizeFullScreen .Polaris-Modal-Body {
            max-height: 90vh !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .popup-config-layout {
            display: flex !important;
            height: 85vh !important;
            overflow: hidden !important;
          }
          .popup-config-settings {
            flex: 1 !important;
            overflow-y: auto !important;
            padding-right: 16px !important;
            max-height: 85vh !important;
          }
          .popup-config-preview {
            width: 600px !important;
            flex-shrink: 0 !important;
            overflow: hidden !important;
            position: sticky !important;
            top: 0 !important;
            height: fit-content !important;
            max-height: 85vh !important;
          }
        `}
      </style>
      <Modal
        open={isOpen}
        onClose={onClose}
        title="Popup Configuration"
        size="fullScreen"
        primaryAction={{
          content: "Save Configuration",
          onAction: handleSaveConfig,
          loading: fetcher.state === "submitting",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: onClose,
          },
        ]}
      >
      <Modal.Section>
        <div className="popup-config-layout">
          <div className="popup-config-settings">
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Popup Configuration
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Customize your popup to engage visitors and boost conversions. Choose between different popup types and configure all settings.
                  </Text>
                </BlockStack>
                
                <Divider />
                
                <TextField
                  label="Popup Name"
                  value={popupName}
                  onChange={(value) => setPopupName(value.slice(0, 50))}
                  placeholder={`${popupType.charAt(0).toUpperCase() + popupType.slice(1)} Popup`}
                  maxLength={50}
                  showCharacterCount
                  helpText="Give your popup a descriptive name for easy identification (max 50 characters)"
                />
                
                <Select
                  label="Popup Type"
                  options={popupTypeOptions}
                  value={popupType}
                  onChange={setPopupType}
                />
                
                <Divider />
                
                {renderConfigurationPanel()}
                
                <Divider />
                
                {renderPageTargeting()}
              </BlockStack>
            </Card>
          </div>
          
          <div className="popup-config-preview">
            {renderPreviewPanel()}
          </div>
        </div>
      </Modal.Section>
    </Modal>
    </>
  );
}