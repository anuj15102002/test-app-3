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
          type: "email",
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
          segments: null,
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
        segments: type === "wheel" ? JSON.stringify(config.segments) : null,
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
        segments: type === "wheel" ? JSON.stringify(config.segments) : null,
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
  
  // Initialize popup type from existing config or default to email
  const [popupType, setPopupType] = useState(existingConfig?.type || "email");
  
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
  
  // Spinning wheel configuration
  const [wheelConfig, setWheelConfig] = useState(() => {
    if (existingConfig && existingConfig.type === "wheel") {
      return {
        title: existingConfig.title,
        description: existingConfig.description,
        buttonText: existingConfig.buttonText,
        segments: existingConfig.segments ? JSON.parse(existingConfig.segments) : [
          { label: "5% Off", color: "#ff6b6b" },
          { label: "10% Off", color: "#4ecdc4" },
          { label: "15% Off", color: "#45b7d1" },
          { label: "20% Off", color: "#96ceb4" },
          { label: "Try Again", color: "#feca57" },
          { label: "Free Shipping", color: "#ff9ff3" },
        ],
        backgroundColor: existingConfig.backgroundColor,
        textColor: existingConfig.textColor,
        displayDelay: existingConfig.displayDelay,
        frequency: existingConfig.frequency || "once",
        exitIntent: existingConfig.exitIntent || false,
        exitIntentDelay: existingConfig.exitIntentDelay || 1000,
      };
    }
    return {
      title: "Spin to Win!",
      description: "Try your luck and win amazing discounts",
      buttonText: "Spin Now",
      segments: [
        { label: "5% Off", color: "#ff6b6b" },
        { label: "10% Off", color: "#4ecdc4" },
        { label: "15% Off", color: "#45b7d1" },
        { label: "20% Off", color: "#96ceb4" },
        { label: "Try Again", color: "#feca57" },
        { label: "Free Shipping", color: "#ff9ff3" },
      ],
      backgroundColor: "#ffffff",
      textColor: "#000000",
      displayDelay: 2000,
      frequency: "once",
      exitIntent: false,
      exitIntentDelay: 1000,
    };
  });

  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleSaveConfig = useCallback(() => {
    const config = popupType === "email" ? emailConfig : wheelConfig;
    
    fetcher.submit(
      { popupConfig: JSON.stringify({ type: popupType, config }) },
      { method: "POST" }
    );
  }, [popupType, emailConfig, wheelConfig, fetcher]);

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
    { label: "Spinning Wheel Discount", value: "wheel" },
  ];

  // Preset templates for quick setup
  const presetTemplates = useMemo(() => ({
    emailWelcome: {
      type: "email",
      title: "Welcome! Get 10% Off",
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
    },
    emailBlackFriday: {
      type: "email",
      title: "Black Friday Special - 25% Off!",
      description: "Limited time offer! Don't miss out on huge savings",
      placeholder: "Your email for exclusive deal",
      buttonText: "Claim 25% Off",
      discountCode: "BLACKFRIDAY25",
      backgroundColor: "#000000",
      textColor: "#ffffff",
      buttonColor: "#ff6b35",
      borderRadius: 12,
      showCloseButton: true,
      displayDelay: 2000,
    },
    wheelFun: {
      type: "wheel",
      title: "Spin to Win Amazing Prizes!",
      description: "Try your luck and win exclusive discounts",
      buttonText: "Spin Now!",
      segments: [
        { label: "5% Off", color: "#ff6b6b" },
        { label: "10% Off", color: "#4ecdc4" },
        { label: "15% Off", color: "#45b7d1" },
        { label: "20% Off", color: "#96ceb4" },
        { label: "Free Shipping", color: "#feca57" },
        { label: "Try Again", color: "#ff9ff3" },
      ],
      backgroundColor: "#ffffff",
      textColor: "#000000",
      displayDelay: 2000,
    }
  }), []);

  const applyTemplate = useCallback((templateKey) => {
    const template = presetTemplates[templateKey];
    if (template.type === "email") {
      setEmailConfig(template);
      setPopupType("email");
    } else if (template.type === "wheel") {
      setWheelConfig(template);
      setPopupType("wheel");
    }
  }, [presetTemplates]);

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

  const renderWheelConfig = () => (
    <BlockStack gap="400">
      <Text as="h3" variant="headingMd">Spinning Wheel Configuration</Text>
      
      <TextField
        label="Popup Title"
        value={wheelConfig.title}
        onChange={(value) => setWheelConfig({ ...wheelConfig, title: value })}
        placeholder="Enter popup title"
      />
      
      <TextField
        label="Description"
        value={wheelConfig.description}
        onChange={(value) => setWheelConfig({ ...wheelConfig, description: value })}
        multiline={3}
        placeholder="Enter popup description"
      />
      
      <TextField
        label="Button Text"
        value={wheelConfig.buttonText}
        onChange={(value) => setWheelConfig({ ...wheelConfig, buttonText: value })}
        placeholder="Spin button text"
      />
      
      <Text as="h4" variant="headingSm">Wheel Segments</Text>
      <BlockStack gap="200">
        {wheelConfig.segments.map((segment, index) => (
          <InlineStack key={index} gap="200" align="center">
            <Box minWidth="100px">
              <TextField
                value={segment.label}
                onChange={(value) => {
                  const newSegments = [...wheelConfig.segments];
                  newSegments[index].label = value;
                  setWheelConfig({ ...wheelConfig, segments: newSegments });
                }}
                placeholder="Segment text"
              />
            </Box>
            <Box minWidth="60px">
              <input
                type="color"
                value={segment.color}
                onChange={(e) => {
                  const newSegments = [...wheelConfig.segments];
                  newSegments[index].color = e.target.value;
                  setWheelConfig({ ...wheelConfig, segments: newSegments });
                }}
                style={{ width: "40px", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
              />
            </Box>
          </InlineStack>
        ))}
      </BlockStack>
      
      <InlineStack gap="400">
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Background Color</Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <input
              type="color"
              value={wheelConfig.backgroundColor}
              onChange={(e) => setWheelConfig({ ...wheelConfig, backgroundColor: e.target.value })}
              style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
          </Box>
        </Box>
        <Box minWidth="200px">
          <Text as="p" variant="bodyMd">Text Color</Text>
          <Box padding="200" background="bg-surface-secondary" borderRadius="200">
            <input
              type="color"
              value={wheelConfig.textColor}
              onChange={(e) => setWheelConfig({ ...wheelConfig, textColor: e.target.value })}
              style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
            />
          </Box>
        </Box>
      </InlineStack>
      
      <RangeSlider
        label={`Display Delay: ${wheelConfig.displayDelay / 1000}s`}
        value={wheelConfig.displayDelay}
        onChange={(value) => setWheelConfig({ ...wheelConfig, displayDelay: value })}
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
        value={wheelConfig.frequency}
        onChange={(value) => setWheelConfig({ ...wheelConfig, frequency: value })}
        helpText="Control how often the popup appears to the same visitor"
      />
      
      <Checkbox
        label="Enable exit intent detection"
        checked={wheelConfig.exitIntent}
        onChange={(checked) => setWheelConfig({ ...wheelConfig, exitIntent: checked })}
        helpText="Show popup when user is about to leave the page"
      />
      
      {wheelConfig.exitIntent && (
        <RangeSlider
          label={`Exit intent delay: ${wheelConfig.exitIntentDelay}ms`}
          value={wheelConfig.exitIntentDelay}
          onChange={(value) => setWheelConfig({ ...wheelConfig, exitIntentDelay: value })}
          min={500}
          max={3000}
          step={100}
          helpText="Delay before exit intent triggers"
        />
      )}
    </BlockStack>
  );

  const renderPreview = () => {
    const config = popupType === "email" ? emailConfig : wheelConfig;
    
    return (
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between">
            <Text as="h3" variant="headingMd">Preview</Text>
            <Badge tone="info">{popupType === "email" ? "Email Popup" : "Spinning Wheel"}</Badge>
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
                backgroundColor: config.backgroundColor,
                color: config.textColor,
                padding: "24px",
                borderRadius: `${popupType === "email" ? emailConfig.borderRadius : 8}px`,
                textAlign: "center",
                maxWidth: "400px",
                margin: "0 auto",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <BlockStack gap="300">
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
                  <BlockStack gap="200">
                    <div
                      style={{
                        width: "200px",
                        height: "200px",
                        borderRadius: "50%",
                        border: "8px solid #333",
                        margin: "0 auto",
                        position: "relative",
                        background: `conic-gradient(${wheelConfig.segments.map((segment, index) =>
                          `${segment.color} ${index * (360 / wheelConfig.segments.length)}deg ${(index + 1) * (360 / wheelConfig.segments.length)}deg`
                        ).join(", ")})`,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          backgroundColor: "#fff",
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          border: "2px solid #333",
                        }}
                      />
                    </div>
                    <button
                      style={{
                        backgroundColor: "#007ace",
                        color: "#fff",
                        padding: "12px 24px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      {wheelConfig.buttonText}
                    </button>
                  </BlockStack>
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
                
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">🚀 Quick Setup Templates</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Choose a pre-designed template to get started instantly
                  </Text>
                  <InlineStack gap="200">
                    <Button onClick={() => applyTemplate('emailWelcome')} size="small">
                      📧 Welcome Email
                    </Button>
                    <Button onClick={() => applyTemplate('emailBlackFriday')} size="small">
                      🖤 Black Friday
                    </Button>
                    <Button onClick={() => applyTemplate('wheelFun')} size="small">
                      🎡 Spin Wheel
                    </Button>
                  </InlineStack>
                </BlockStack>
                
                <Divider />
                
                <Select
                  label="Popup Type"
                  options={popupTypeOptions}
                  value={popupType}
                  onChange={setPopupType}
                />
                
                <Divider />
                
                {popupType === "email" ? renderEmailConfig() : renderWheelConfig()}
                
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
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Popup Statistics
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Total Views
                      </Text>
                      <Badge>1,234</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Conversions
                      </Text>
                      <Badge tone="success">156</Badge>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Conversion Rate
                      </Text>
                      <Badge tone="info">12.6%</Badge>
                    </InlineStack>
                  </BlockStack>
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
                      • Make sure your discount codes are valid
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
