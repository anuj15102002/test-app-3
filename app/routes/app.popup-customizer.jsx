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

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Load existing popup configuration if it exists
    let existingConfig = await db.popupConfig.findUnique({
      where: { shop: session.shop }
    });
    
    // Check app embed status based on existing configuration
    let appEmbedEnabled = false;
    if (existingConfig) {
      appEmbedEnabled = existingConfig.displayDelay === 0 &&
                      existingConfig.frequency === "once" &&
                      existingConfig.exitIntent === false;
    }
    
    return { existingConfig, appEmbedEnabled };
  } catch (error) {
    return { existingConfig: null, appEmbedEnabled: false };
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
    // Check app embed status based on existing configuration
    let appEmbedEnabled = false;
    const existingConfig = await db.popupConfig.findUnique({
      where: { shop: session.shop }
    });
    
    if (existingConfig) {
      appEmbedEnabled = existingConfig.displayDelay === 0 &&
                      existingConfig.frequency === "once" &&
                      existingConfig.exitIntent === false;
    }
    
    // Save popup configuration to database
    const savedConfig = await db.popupConfig.upsert({
      where: { shop: session.shop },
      update: {
        type,
        title: config.title,
        description: config.description,
        placeholder: config.placeholder || "",
        buttonText: config.buttonText || (type === "community" ? "Follow Us" : ""),
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
        backgroundType: config.backgroundType || null,
        bannerImage: type === "community" ? config.bannerImage || null : null,
        socialIcons: type === "community" ? JSON.stringify(config.socialIcons) : null,
        askMeLaterText: type === "community" ? config.askMeLaterText || null : null,
        showAskMeLater: type === "community" ? config.showAskMeLater !== false : true,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        shop: session.shop,
        type,
        title: config.title,
        description: config.description,
        placeholder: config.placeholder || "",
        buttonText: config.buttonText || (type === "community" ? "Follow Us" : ""),
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
        backgroundType: config.backgroundType || null,
        bannerImage: type === "community" ? config.bannerImage || null : null,
        socialIcons: type === "community" ? JSON.stringify(config.socialIcons) : null,
        askMeLaterText: type === "community" ? config.askMeLaterText || null : null,
        showAskMeLater: type === "community" ? config.showAskMeLater !== false : true,
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
  const appEmbedEnabled = loaderData?.appEmbedEnabled || false;
  
  // Initialize popup type from existing config or default to wheel-email
  const [popupType, setPopupType] = useState(existingConfig?.type || "wheel-email");
  
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
      showCloseButton: true,
      displayDelay: 3000,
      frequency: "once",
      exitIntent: false,
      exitIntentDelay: 1000,
    };
  });

  const handleSaveConfig = useCallback(() => {
    const config = popupType === "email" ? emailConfig : (popupType === "community" ? communityConfig : wheelEmailConfig);
    
    fetcher.submit(
      { popupConfig: JSON.stringify({ type: popupType, config }) },
      { method: "POST" }
    );
  }, [popupType, emailConfig, wheelEmailConfig, communityConfig, fetcher]);

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
    { label: "Community Social Popup", value: "community" },
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
                      ) : popupType === "community" ? (
                        <Text as="span" variant="headingLg">👥</Text>
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
                ) : popupType === "community" ? (
                  // Community Popup Preview
                  <BlockStack gap="200">
                    {communityConfig.bannerImage && (
                      <div
                        style={{
                          width: "100%",
                          height: "120px",
                          backgroundImage: `url(${communityConfig.bannerImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          borderRadius: "8px",
                          marginBottom: "10px",
                        }}
                      />
                    )}
                    <div style={{ display: "flex", justifyContent: "center", gap: "15px", margin: "15px 0" }}>
                      {communityConfig.socialIcons.filter(icon => icon.enabled && icon.url).map((social, index) => (
                        <div
                          key={social.platform}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: social.platform === 'facebook' ? '#1877f2' :
                                           social.platform === 'instagram' ? '#E4405F' :
                                           social.platform === 'linkedin' ? '#0077b5' :
                                           social.platform === 'x' ? '#000000' : '#666',
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "18px",
                            cursor: "pointer",
                          }}
                        >
                          {social.platform === 'facebook' ? 'f' :
                           social.platform === 'instagram' ? '📷' :
                           social.platform === 'linkedin' ? 'in' :
                           social.platform === 'x' ? 'X' : '?'}
                        </div>
                      ))}
                    </div>
                    {communityConfig.showAskMeLater && (
                      <div style={{ textAlign: "center", marginTop: "10px" }}>
                        <a
                          href="#"
                          style={{
                            color: config.textColor,
                            textDecoration: "underline",
                            fontSize: "14px",
                            opacity: 0.8,
                          }}
                        >
                          {communityConfig.askMeLaterText}
                        </a>
                      </div>
                    )}
                  </BlockStack>
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
        </BlockStack>
      </Card>
    );
  };

  // Realtime popup preview component
  const renderRealtimePopup = () => {
    if (!showRealtimePreview) return null;

    const config = popupType === "email" ? emailConfig : wheelEmailConfig;

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
        
        {popupType === "email" ? (
          // Email Popup
          <div
            style={{
              backgroundColor: config.backgroundColor || '#ffffff',
              color: config.textColor || '#000000',
              padding: '24px',
              borderRadius: `${config.borderRadius || 8}px`,
              textAlign: 'center',
              maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              position: 'relative',
              animation: 'popupSlideIn 0.3s ease-out',
            }}
          >
            {config.showCloseButton && (
              <button
                onClick={() => setShowRealtimePreview(false)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0,0,0,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  color: config.textColor || '#000000',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            )}
            
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📧</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 15px 0', color: config.textColor || '#000000' }}>
              {config.title}
            </h3>
            <p style={{ marginBottom: '20px', lineHeight: '1.5', color: config.textColor || '#000000' }}>
              {config.description}
            </p>
            <input
              type="email"
              placeholder={config.placeholder}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              readOnly
            />
            <button style={{
              width: '100%',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px',
              backgroundColor: config.buttonColor || '#007ace',
              color: 'white'
            }}>
              {config.buttonText}
            </button>
          </div>
        ) : (
          // Wheel-Email Combo Popup
          <div
            style={{
              background: config.backgroundColor || 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxWidth: '600px',
              width: '90%',
              display: 'flex',
              alignItems: 'center',
              minHeight: '300px',
              animation: 'popupSlideIn 0.3s ease-out',
            }}
          >
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
              }}
            >
              ×
            </button>
            
            {/* Wheel Section */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 0, overflow: 'hidden' }}>
              <div
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  border: '4px solid white',
                  position: 'relative',
                  transform: 'translateX(-50%)',
                  background: `conic-gradient(${config.segments.map((segment, index) =>
                    `${segment.color} ${index * (360 / config.segments.length)}deg ${(index + 1) * (360 / config.segments.length)}deg`
                  ).join(", ")})`,
                  boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Wheel pointer */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-6px',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderLeft: '12px solid white',
                    zIndex: 10,
                  }}
                />
                {/* Wheel center */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: '2px solid #1e3c72',
                    zIndex: 5,
                  }}
                />
                {/* Wheel segment labels */}
                {config.segments.map((segment, index) => {
                  const segmentAngle = (360 / config.segments.length) * index + (360 / config.segments.length) / 2;
                  const radius = 60;
                  const x = Math.cos((segmentAngle - 90) * Math.PI / 180) * radius;
                  const y = Math.sin((segmentAngle - 90) * Math.PI / 180) * radius;
                  
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        pointerEvents: 'none',
                        textAlign: 'center',
                        lineHeight: '1.1',
                        maxWidth: '50px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '16px',
                      }}
                    >
                      {segment.label}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Form Section */}
            <div style={{ flex: 1, padding: '20px 30px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>
                {config.title}
              </div>
              <div style={{ fontSize: '14px', marginBottom: '15px', color: 'rgba(255, 255, 255, 0.9)' }}>
                {config.subtitle}
              </div>
              <div style={{ fontSize: '12px', marginBottom: '20px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.4' }}>
                {config.description}
              </div>
              
              <input
                type="email"
                placeholder={config.placeholder}
                style={{
                  padding: '12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  color: '#666',
                  marginBottom: '12px',
                  fontSize: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                readOnly
              />
              
              <button
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {config.buttonText}
              </button>
            </div>
          </div>
        )}
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
                
                <Select
                  label="Popup Type"
                  options={popupTypeOptions}
                  value={popupType}
                  onChange={setPopupType}
                />
                
                <Divider />
                
                {popupType === "email" ? renderEmailConfig() : (popupType === "community" ? renderCommunityConfig() : renderWheelEmailConfig())}
                
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