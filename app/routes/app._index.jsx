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
  const discountCodesFetcher = useFetcher();
  const analyticsFetcher = useFetcher();
  const shopify = useAppBridge();
  const loaderData = useLoaderData();
  const existingConfig = loaderData?.existingConfig || null;
  
  // Initialize popup type from existing config or default to wheel-email
  const [popupType, setPopupType] = useState(existingConfig?.type || "wheel-email");
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState("24h");
  
  // Load discount codes and analytics on component mount
  useEffect(() => {
    discountCodesFetcher.load("/api/admin/discount-codes");
    analyticsFetcher.load(`/api/admin/analytics?timeRange=${analyticsTimeRange}`);
  }, []);

  // Reload analytics when time range changes
  useEffect(() => {
    analyticsFetcher.load(`/api/admin/analytics?timeRange=${analyticsTimeRange}`);
  }, [analyticsTimeRange]);

  // Auto-refresh analytics every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      analyticsFetcher.load(`/api/admin/analytics?timeRange=${analyticsTimeRange}`);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [analyticsTimeRange]);
  
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
                  <Button onClick={() => setIsPreviewMode(!isPreviewMode)}>
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
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingMd">
                      Real-time Analytics
                    </Text>
                    <Select
                      options={[
                        { label: "Last 24 hours", value: "24h" },
                        { label: "Last 7 days", value: "7d" },
                        { label: "Last 30 days", value: "30d" },
                      ]}
                      value={analyticsTimeRange}
                      onChange={setAnalyticsTimeRange}
                    />
                  </InlineStack>
                  
                  {analyticsFetcher.data?.success ? (
                    <BlockStack gap="300">
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">
                            Total Views
                          </Text>
                          <Badge>{analyticsFetcher.data.analytics.summary.totalViews.toLocaleString()}</Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">
                            Emails Collected
                          </Text>
                          <Badge tone="success">{analyticsFetcher.data.analytics.summary.emailsEntered.toLocaleString()}</Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">
                            Wheel Spins
                          </Text>
                          <Badge tone="info">{analyticsFetcher.data.analytics.summary.spins.toLocaleString()}</Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">
                            Winners
                          </Text>
                          <Badge tone="success">{analyticsFetcher.data.analytics.summary.wins.toLocaleString()}</Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">
                            Codes Copied
                          </Text>
                          <Badge tone="attention">{analyticsFetcher.data.analytics.summary.codesCopied.toLocaleString()}</Badge>
                        </InlineStack>
                      </BlockStack>
                      
                      <Divider />
                      
                      <BlockStack gap="200">
                        <Text as="h4" variant="headingSm">Conversion Rates</Text>
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">
                            Email Conversion
                          </Text>
                          <Badge tone={analyticsFetcher.data.analytics.summary.emailConversionRate > 10 ? "success" : "warning"}>
                            {analyticsFetcher.data.analytics.summary.emailConversionRate}%
                          </Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">
                            Win Rate
                          </Text>
                          <Badge tone={analyticsFetcher.data.analytics.summary.winRate > 20 ? "success" : "info"}>
                            {analyticsFetcher.data.analytics.summary.winRate}%
                          </Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">
                            Copy Rate
                          </Text>
                          <Badge tone={analyticsFetcher.data.analytics.summary.copyRate > 80 ? "success" : "warning"}>
                            {analyticsFetcher.data.analytics.summary.copyRate}%
                          </Badge>
                        </InlineStack>
                      </BlockStack>
                      
                      <Text as="p" variant="bodySm" tone="subdued">
                        Last updated: {new Date(analyticsFetcher.data.analytics.lastUpdated).toLocaleTimeString()}
                      </Text>
                    </BlockStack>
                  ) : (
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">Loading analytics...</Text>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Total Views</Text>
                        <Badge>-</Badge>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Conversions</Text>
                        <Badge>-</Badge>
                      </InlineStack>
                    </BlockStack>
                  )}
                </BlockStack>
              </Card>
              
              <Card>
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    Live Activity Feed
                  </Text>
                  {analyticsFetcher.data?.success && analyticsFetcher.data.analytics.recentEvents ? (
                    analyticsFetcher.data.analytics.recentEvents.length > 0 ? (
                      <BlockStack gap="200">
                        {analyticsFetcher.data.analytics.recentEvents.map((event, index) => (
                          <Box key={event.id} padding="300" background="bg-surface-secondary" borderRadius="200">
                            <InlineStack align="space-between">
                              <BlockStack gap="100">
                                <InlineStack gap="200" align="center">
                                  <Badge tone={
                                    event.eventType === 'win' ? 'success' :
                                    event.eventType === 'view' ? 'info' :
                                    event.eventType === 'email_entered' ? 'attention' :
                                    event.eventType === 'copy_code' ? 'success' :
                                    'subdued'
                                  }>
                                    {event.eventType === 'view' ? '👁️ View' :
                                     event.eventType === 'email_entered' ? '📧 Email' :
                                     event.eventType === 'spin' ? '🎡 Spin' :
                                     event.eventType === 'win' ? '🎉 Win' :
                                     event.eventType === 'lose' ? '😔 Lose' :
                                     event.eventType === 'copy_code' ? '📋 Copy' :
                                     event.eventType === 'close' ? '❌ Close' :
                                     event.eventType}
                                  </Badge>
                                  {event.email && (
                                    <Text as="span" variant="bodyMd" tone="subdued">
                                      {event.email.substring(0, 3)}***@{event.email.split('@')[1]}
                                    </Text>
                                  )}
                                  {event.prizeLabel && (
                                    <Text as="span" variant="bodyMd">
                                      {event.prizeLabel}
                                    </Text>
                                  )}
                                  {event.discountCode && (
                                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                                      {event.discountCode}
                                    </Text>
                                  )}
                                </InlineStack>
                              </BlockStack>
                              <Text as="span" variant="bodySm" tone="subdued">
                                {event.timeAgo}
                              </Text>
                            </InlineStack>
                          </Box>
                        ))}
                      </BlockStack>
                    ) : (
                      <EmptyState
                        heading="No activity yet"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>Activity will appear here when customers interact with your popup.</p>
                      </EmptyState>
                    )
                  ) : (
                    <Text as="p" variant="bodyMd">Loading activity...</Text>
                  )}
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Generated Discount Codes
                  </Text>
                  {discountCodesFetcher.data?.success ? (
                    discountCodesFetcher.data.discountCodes.length > 0 ? (
                      <DataTable
                        columnContentTypes={['text', 'text', 'text', 'text', 'text']}
                        headings={['Code', 'Email', 'Value', 'Status', 'Created']}
                        rows={discountCodesFetcher.data.discountCodes.slice(0, 5).map(code => [
                          code.code,
                          code.email,
                          `${code.discountValue}${code.discountType === 'percentage' ? '%' : '$'} off`,
                          code.isActive ?
                            <Badge tone="success">Active</Badge> :
                            <Badge tone="critical">Inactive</Badge>,
                          new Date(code.createdAt).toLocaleDateString()
                        ])}
                      />
                    ) : (
                      <EmptyState
                        heading="No discount codes yet"
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                      >
                        <p>Discount codes will appear here when customers claim them from your popup.</p>
                      </EmptyState>
                    )
                  ) : (
                    <Text as="p" variant="bodyMd">Loading discount codes...</Text>
                  )}
                  {discountCodesFetcher.data?.discountCodes?.length > 5 && (
                    <Button
                      onClick={() => discountCodesFetcher.load("/api/admin/discount-codes")}
                      variant="plain"
                    >
                      View all {discountCodesFetcher.data.discountCodes.length} codes
                    </Button>
                  )}
                </BlockStack>
              </Card>
              
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
                      • Discount codes are automatically created in Shopify
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
