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
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { EmailIcon } from "@shopify/polaris-icons";

export default function PopupCreationModal({ active, onClose, existingConfig }) {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
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
      showCloseButton: false,
      displayDelay: 3000,
      frequency: "once",
      exitIntent: false,
      exitIntentDelay: 1000,
    };
  });

  const handleSaveConfig = useCallback(() => {
    const config = popupType === "email" ? emailConfig : (popupType === "community" ? communityConfig : wheelEmailConfig);
    
    // Submit to the popup-customizer route
    fetcher.submit(
      { popupConfig: JSON.stringify({ type: popupType, config }) },
      { method: "POST", action: "/app/popup-customizer" }
    );
  }, [popupType, emailConfig, wheelEmailConfig, communityConfig, fetcher]);

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
            <div
              style={{
                backgroundColor: popupType === "wheel-email" ? "transparent" : config.backgroundColor,
                color: config.textColor,
                padding: popupType === "community" ? "0" : (popupType === "wheel-email" ? "0" : "24px"),
                borderRadius: `${popupType === "email" ? emailConfig.borderRadius : (popupType === "community" ? 12 : 8)}px`,
                textAlign: "center",
                maxWidth: "400px",
                margin: "0 auto",
                boxShadow: popupType === "wheel-email" ? "none" : "0 4px 12px rgba(0,0,0,0.15)",
                overflow: "hidden",
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
                  // Community Popup Preview - Exact match with actual popup
                  <div style={{ position: "relative", overflow: "hidden" }}>
                    {/* Banner at the very top */}
                    <div
                      style={{
                        width: "100%",
                        height: "80px",
                        backgroundColor: "#f0f0f0",
                        backgroundImage: communityConfig.bannerImage ? `url(${communityConfig.bannerImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        borderRadius: `${communityConfig.borderRadius}px ${communityConfig.borderRadius}px 0 0`,
                        position: "relative",
                      }}
                    >
                      {/* Close button positioned over banner - hidden by default */}
                      {communityConfig.showCloseButton && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            width: "20px",
                            height: "20px",
                            backgroundColor: "rgba(0,0,0,0.5)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "14px",
                            cursor: "pointer",
                          }}
                        >
                          ×
                        </div>
                      )}
                    </div>
                    
                    {/* Content wrapper with padding */}
                    <div style={{
                      padding: "20px",
                      backgroundColor: communityConfig.backgroundColor,
                      borderRadius: `0 0 ${communityConfig.borderRadius}px ${communityConfig.borderRadius}px`
                    }}>
                      {/* Title and Description */}
                      <div style={{ textAlign: "center", marginBottom: "20px" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          marginBottom: "10px"
                        }}>
                          <span style={{ fontSize: "18px" }}>👥</span>
                          <h3 style={{
                            color: communityConfig.textColor,
                            margin: "0",
                            fontSize: "16px",
                            fontWeight: "600"
                          }}>
                            {communityConfig.title}
                          </h3>
                        </div>
                        <p style={{
                          color: communityConfig.textColor,
                          fontSize: "13px",
                          lineHeight: "1.4",
                          margin: "0"
                        }}>
                          {communityConfig.description}
                        </p>
                      </div>
                      
                      {/* Social Icons with proper colors */}
                      <div style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "12px",
                        marginBottom: "20px"
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
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                transition: "transform 0.2s ease",
                                fontSize: "16px",
                                fontWeight: "bold",
                                ...iconStyle,
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                              }}
                              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              title={`${social.platform.charAt(0).toUpperCase() + social.platform.slice(1)}`}
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
                        <div style={{ textAlign: "center" }}>
                          <a
                            href="#"
                            style={{
                              color: communityConfig.textColor,
                              textDecoration: "underline",
                              fontSize: "13px",
                              opacity: 0.7,
                            }}
                          >
                            {communityConfig.askMeLaterText}
                          </a>
                        </div>
                      )}
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
        </BlockStack>
      </Card>
    );
  };

  // Realtime popup preview component (same as in popup-customizer)
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
        ) : popupType === "community" ? (
          // Community Social Popup - Exact match with storefront implementation
          <div
            style={{
              backgroundColor: config.backgroundColor || '#ffffff',
              borderRadius: `${config.borderRadius || 12}px`,
              textAlign: 'center',
              maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              position: 'relative',
              animation: 'popupSlideIn 0.3s ease-out',
              overflow: 'hidden',
            }}
          >
            {/* Banner at the very top */}
            <div
              style={{
                width: '100%',
                height: '120px',
                backgroundColor: '#f0f0f0',
                backgroundImage: config.bannerImage ? `url(${config.bannerImage})` : 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDQwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImJhbm5lckdyYWRpZW50IiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzY2NjsiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojY2NjOyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMTIwIiBmaWxsPSJ1cmwoI2Jhbm5lckdyYWRpZW50KSIvPgo8dGV4dCB4PSIyMDAiIHk9IjY1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCI+QkFOTkVSPC90ZXh0Pgo8L3N2Zz4=")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: `${config.borderRadius || 12}px ${config.borderRadius || 12}px 0 0`,
                position: 'relative',
              }}
            >
              {/* Close button positioned over banner */}
              {config.showCloseButton && (
                <button
                  onClick={() => setShowRealtimePreview(false)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.5)',
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
              )}
            </div>
            
            {/* Content wrapper with padding */}
            <div style={{ padding: '20px' }}>
              {/* Title and Description */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: '0 0 10px 0',
                  color: config.textColor || '#000000'
                }}>
                  {config.title}
                </h3>
                <p style={{
                  marginBottom: '0',
                  lineHeight: '1.5',
                  color: config.textColor || '#000000',
                  fontSize: '14px'
                }}>
                  {config.description}
                </p>
              </div>
              
              {/* Social Icons */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '15px',
                marginBottom: '20px'
              }}>
                {config.socialIcons.filter(icon => icon.enabled).map((social, index) => (
                  <div
                    key={social.platform}
                    style={{
                      width: '50px',
                      height: '50px',
                      backgroundImage: `url('/extensions/pop-up/assets/${social.platform === 'x' ? 'twitter' : social.platform}.png')`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: '#f9f9f9',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onClick={() => {
                      if (social.url) {
                        window.open(social.url, '_blank');
                      }
                    }}
                  />
                ))}
              </div>
              
              {/* Ask Me Later Link */}
              {config.showAskMeLater && (
                <div style={{ textAlign: 'center' }}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowRealtimePreview(false);
                    }}
                    style={{
                      color: config.textColor || '#000000',
                      textDecoration: 'underline',
                      fontSize: '14px',
                      opacity: 0.8,
                    }}
                  >
                    {config.askMeLaterText}
                  </a>
                </div>
              )}
            </div>
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
      large
    >
      <Modal.Section>
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
      </Modal.Section>

      {/* Realtime Popup Preview */}
      {renderRealtimePopup()}
    </Modal>
  );
}