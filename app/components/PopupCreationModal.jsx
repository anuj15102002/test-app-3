import { useState, useCallback, useEffect, useMemo } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Modal,
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
  ChoiceList,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { EmailIcon } from "@shopify/polaris-icons";
import PopupPreview from "./PopupPreview";

export default function PopupCreationModal({ active, onClose, existingConfig, initialPopupType }) {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  // Initialize popup type from props, existing config, or default to wheel-email
  const [popupType, setPopupType] = useState(initialPopupType || existingConfig?.type || "wheel-email");
  
  // State for realtime preview
  const [showRealtimePreview, setShowRealtimePreview] = useState(false);
  
  // Page targeting state
  const [pageTargeting, setPageTargeting] = useState(() => {
    if (existingConfig) {
      return {
        targetAllPages: existingConfig.targetAllPages !== false,
        targetSpecificPages: existingConfig.targetSpecificPages || false,
        selectedPages: existingConfig.pageTargeting ? JSON.parse(existingConfig.pageTargeting) : []
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
          { label: '5% DISCOUNT', color: '#ff6b6b', code: 'SAVE5' },
          { label: 'NO PRIZE', color: '#1e3c72', code: null },
          { label: 'UNLUCKY', color: '#4ecdc4', code: null },
          { label: '5% DISCOUNT', color: '#96ceb4', code: 'SAVE5' },
          { label: 'NO PRIZE', color: '#ff6b6b', code: null },
          { label: 'NEXT TIME', color: '#feca57', code: null }
        ],
        backgroundColor: backgroundColor,
        backgroundType: backgroundType,
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
        frequency: existingConfig.frequency || "once",
        exitIntent: existingConfig.exitIntent || false,
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
      showCloseButton: false,
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
    if (active) {
      fetchStorefrontPages();
    }
  }, [active, fetchStorefrontPages]);

  const handleSaveConfig = useCallback(() => {
    const config = popupType === "email" ? emailConfig : (popupType === "community" ? communityConfig : wheelEmailConfig);
    
    // Submit to the popup-customizer route
    fetcher.submit(
      {
        popupConfig: JSON.stringify({
          type: popupType,
          config,
          pageTargeting: {
            targetAllPages: pageTargeting.targetAllPages,
            targetSpecificPages: pageTargeting.targetSpecificPages,
            selectedPages: pageTargeting.selectedPages
          }
        })
      },
      { method: "POST", action: "/app/popup-customizer" }
    );
  }, [popupType, emailConfig, wheelEmailConfig, communityConfig, pageTargeting, fetcher]);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        shopify.toast.show("Popup configuration saved successfully!");
        onClose(); // Close modal on success
      } else if (fetcher.data.error) {
        shopify.toast.show(`Error: ${fetcher.data.error}`, { isError: true });
      }
    }
  }, [fetcher.data, shopify, onClose]);

  const popupTypeOptions = [
    { label: "Email Discount Popup", value: "email" },
    { label: "Wheel + Email Combo", value: "wheel-email" },
    { label: "Community Social Popup", value: "community" },
  ];

  const renderEmailConfig = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">Email Popup Configuration</Text>
      
      <TextField
        label="Popup Title"
        value={emailConfig.title}
        onChange={(value) => setEmailConfig({ ...emailConfig, title: value.slice(0, 50) })}
        placeholder="Enter popup title"
        maxLength={50}
        showCharacterCount
        helpText="Maximum 50 characters"
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

  const renderPreview = () => {
    const config = popupType === "email" ? emailConfig : (popupType === "community" ? communityConfig : wheelEmailConfig);
    const badgeText = popupType === "email" ? "Email Popup" : (popupType === "community" ? "Community Social Popup" : "Wheel + Email Combo");
    
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
            />
          </Box>
        </BlockStack>
      </Card>
    );
  };

  // Realtime popup preview component using PopupPreview
  const renderRealtimePopup = () => {
    if (!showRealtimePreview) return null;

    const config = popupType === "email" ? emailConfig : (popupType === "community" ? communityConfig : wheelEmailConfig);

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

  // Render page targeting configuration
  const renderPageTargeting = () => {
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
                    {storefrontPages.collections.slice(0, 5).map(page => (
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
                    {storefrontPages.collections.length > 5 && (
                      <Text as="p" variant="bodyMd" tone="subdued">
                        And {storefrontPages.collections.length - 5} more collections...
                      </Text>
                    )}
                  </BlockStack>
                )}

                {/* Products */}
                {storefrontPages.products.length > 0 && (
                  <BlockStack gap="200">
                    <Text as="h5" variant="headingXs" tone="subdued">Products</Text>
                    {storefrontPages.products.slice(0, 3).map(page => (
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
                    {storefrontPages.products.length > 3 && (
                      <Text as="p" variant="bodyMd" tone="subdued">
                        And {storefrontPages.products.length - 3} more products...
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
            width: 800px !important;
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
        open={active}
        onClose={onClose}
        title={existingConfig ? "Edit Popup" : "Create Popup"}
        primaryAction={{
          content: "Save Configuration",
          onAction: handleSaveConfig,
          loading: fetcher.state === "submitting",
        }}
        secondaryActions={[
          {
            content: showRealtimePreview ? "Hide Preview" : "Show Realtime Preview",
            onAction: () => setShowRealtimePreview(!showRealtimePreview),
          },
          {
            content: "Cancel",
            onAction: onClose,
          },
        ]}
        size="fullScreen"
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
                
                {popupType === "email" ? renderEmailConfig() : (popupType === "community" ? renderCommunityConfig() : renderWheelEmailConfig())}
                
                <Divider />
                
                {renderPageTargeting()}
              </BlockStack>
            </Card>
          </div>
          
          <div className="popup-config-preview">
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
          </div>
        </div>
      </Modal.Section>

      {/* Realtime Popup Preview */}
      {renderRealtimePopup()}
    </Modal>
    </>
  );
}