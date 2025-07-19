import { useState, useCallback, useEffect } from "react";
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
} from "@shopify/polaris";
import { ClockIcon, XIcon } from "@shopify/polaris-icons";
import "../styles/timer-popup-modal.css";

/**
 * TimerPopupModal - Modal-based configuration UI for Timer Popup type
 * 
 * Features:
 * - Two-panel layout (Settings + Live Preview)
 * - Real-time configuration updates
 * - Shopify-like UX with Polaris components
 * - Mobile responsive design
 * - Isolated from other popup configurations
 */
export default function TimerPopupModal({ 
  isOpen, 
  onClose, 
  initialConfig = null, 
  onSave,
  onPreviewStorefront 
}) {
  // Timer popup configuration state
  const [timerConfig, setTimerConfig] = useState(() => {
    if (initialConfig) {
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

  // Handle save configuration
  const handleSave = useCallback(() => {
    onSave({
      type: "timer",
      config: timerConfig
    });
  }, [timerConfig, onSave]);

  // Handle preview on storefront
  const handlePreviewStorefront = useCallback(() => {
    onPreviewStorefront({
      type: "timer",
      config: timerConfig
    });
  }, [timerConfig, onPreviewStorefront]);

  // Update configuration helper
  const updateConfig = useCallback((updates) => {
    setTimerConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Render left panel - Settings
  const renderSettingsPanel = () => (
    <Card>
      <BlockStack gap="400">
        <Text as="h3" variant="headingMd">Timer Popup Settings</Text>
        
        {/* Basic Content Settings */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">Content</Text>
          
          <TextField
            label="Popup Title"
            value={timerConfig.title}
            onChange={(value) => updateConfig({ title: value })}
            placeholder="LIMITED TIME OFFER!"
            helpText="Main headline that grabs attention"
          />
          
          <TextField
            label="Description"
            value={timerConfig.description}
            onChange={(value) => updateConfig({ description: value })}
            multiline={3}
            placeholder="Don't miss out on this exclusive deal..."
            helpText="Compelling message to create urgency"
          />
          
          <TextField
            label="Email Placeholder"
            value={timerConfig.placeholder}
            onChange={(value) => updateConfig({ placeholder: value })}
            placeholder="Enter your email to claim this offer"
          />
          
          <TextField
            label="Button Text"
            value={timerConfig.buttonText}
            onChange={(value) => updateConfig({ buttonText: value })}
            placeholder="CLAIM OFFER NOW"
            helpText="Action-oriented text for the CTA button"
          />
          
          <TextField
            label="Discount Code"
            value={timerConfig.discountCode}
            onChange={(value) => updateConfig({ discountCode: value })}
            placeholder="TIMER10"
            helpText="Code customers will receive"
          />
        </BlockStack>

        <Divider />

        {/* Timer Duration Settings */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">Timer Duration</Text>
          
          <InlineStack gap="300">
            <Box minWidth="120px">
              <TextField
                label="Days"
                type="number"
                value={timerConfig.timerDays.toString()}
                onChange={(value) => updateConfig({ timerDays: parseInt(value) || 0 })}
                min={0}
                max={365}
              />
            </Box>
            <Box minWidth="120px">
              <TextField
                label="Hours"
                type="number"
                value={timerConfig.timerHours.toString()}
                onChange={(value) => updateConfig({ timerHours: parseInt(value) || 0 })}
                min={0}
                max={23}
              />
            </Box>
            <Box minWidth="120px">
              <TextField
                label="Minutes"
                type="number"
                value={timerConfig.timerMinutes.toString()}
                onChange={(value) => updateConfig({ timerMinutes: parseInt(value) || 0 })}
                min={0}
                max={59}
              />
            </Box>
            <Box minWidth="120px">
              <TextField
                label="Seconds"
                type="number"
                value={timerConfig.timerSeconds.toString()}
                onChange={(value) => updateConfig({ timerSeconds: parseInt(value) || 0 })}
                min={0}
                max={59}
              />
            </Box>
          </InlineStack>

          <InlineStack gap="300">
            <Box minWidth="120px">
              <TextField
                label="Timer Icon"
                value={timerConfig.timerIcon}
                onChange={(value) => updateConfig({ timerIcon: value })}
                placeholder="⏰"
                helpText="Emoji or icon"
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
                onChange={(value) => updateConfig({ onExpiration: value })}
              />
            </Box>
          </InlineStack>
        </BlockStack>

        <Divider />

        {/* Expired State Configuration */}
        {timerConfig.onExpiration === "show_expired" && (
          <BlockStack gap="300">
            <Text as="h4" variant="headingSm">Expired State</Text>
            
            <TextField
              label="Expired Title"
              value={timerConfig.expiredTitle}
              onChange={(value) => updateConfig({ expiredTitle: value })}
              placeholder="OFFER EXPIRED"
            />
            
            <TextField
              label="Expired Message"
              value={timerConfig.expiredMessage}
              onChange={(value) => updateConfig({ expiredMessage: value })}
              multiline={3}
              placeholder="Message when timer expires..."
            />
            
            <InlineStack gap="300">
              <Box minWidth="120px">
                <TextField
                  label="Expired Icon"
                  value={timerConfig.expiredIcon}
                  onChange={(value) => updateConfig({ expiredIcon: value })}
                  placeholder="⏰"
                />
              </Box>
              <Box minWidth="200px">
                <TextField
                  label="Expired Button Text"
                  value={timerConfig.expiredButtonText}
                  onChange={(value) => updateConfig({ expiredButtonText: value })}
                  placeholder="CONTINUE SHOPPING"
                />
              </Box>
            </InlineStack>
          </BlockStack>
        )}

        <Divider />

        {/* Success State Configuration */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">Success State</Text>
          
          <TextField
            label="Success Title"
            value={timerConfig.successTitle}
            onChange={(value) => updateConfig({ successTitle: value })}
            placeholder="SUCCESS!"
          />
          
          <TextField
            label="Success Message"
            value={timerConfig.successMessage}
            onChange={(value) => updateConfig({ successMessage: value })}
            multiline={2}
            placeholder="Message when user submits email..."
          />
        </BlockStack>

        <Divider />

        {/* Styling Settings */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">Styling</Text>
          
          <TextField
            label="Background"
            value={timerConfig.backgroundColor}
            onChange={(value) => updateConfig({ backgroundColor: value })}
            placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            helpText="CSS gradient or solid color"
          />
          
          <InlineStack gap="300">
            <Box minWidth="200px">
              <Text as="p" variant="bodyMd">Text Color</Text>
              <Box padding="200" background="bg-surface-secondary" borderRadius="200">
                <input
                  type="color"
                  value={timerConfig.textColor}
                  onChange={(e) => updateConfig({ textColor: e.target.value })}
                  style={{ width: "100%", height: "30px", border: "none", borderRadius: "4px", cursor: "pointer" }}
                />
              </Box>
            </Box>
          </InlineStack>
          
          <RangeSlider
            label={`Border Radius: ${timerConfig.borderRadius}px`}
            value={timerConfig.borderRadius}
            onChange={(value) => updateConfig({ borderRadius: value })}
            min={0}
            max={30}
            step={1}
          />
        </BlockStack>

        <Divider />

        {/* Display Settings */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">Display Settings</Text>
          
          <RangeSlider
            label={`Display Delay: ${timerConfig.displayDelay / 1000}s`}
            value={timerConfig.displayDelay}
            onChange={(value) => updateConfig({ displayDelay: value })}
            min={0}
            max={10000}
            step={500}
          />
          
          <Select
            label="Display Frequency"
            options={[
              { label: "Show once per visitor", value: "once" },
              { label: "Show once per day", value: "daily" },
              { label: "Show once per week", value: "weekly" },
              { label: "Show on every visit", value: "always" },
            ]}
            value={timerConfig.frequency}
            onChange={(value) => updateConfig({ frequency: value })}
          />
          
          <Checkbox
            label="Show close button"
            checked={timerConfig.showCloseButton}
            onChange={(checked) => updateConfig({ showCloseButton: checked })}
          />
          
          <Checkbox
            label="Enable exit intent detection"
            checked={timerConfig.exitIntent}
            onChange={(checked) => updateConfig({ exitIntent: checked })}
            helpText="Show popup when user is about to leave"
          />
          
          {timerConfig.exitIntent && (
            <RangeSlider
              label={`Exit intent delay: ${timerConfig.exitIntentDelay}ms`}
              value={timerConfig.exitIntentDelay}
              onChange={(value) => updateConfig({ exitIntentDelay: value })}
              min={500}
              max={3000}
              step={100}
            />
          )}
        </BlockStack>

        <Divider />

        {/* Additional Settings */}
        <BlockStack gap="300">
          <Text as="h4" variant="headingSm">Additional</Text>
          
          <TextField
            label="Disclaimer Text"
            value={timerConfig.disclaimer}
            onChange={(value) => updateConfig({ disclaimer: value })}
            placeholder="Limited time offer. Valid while supplies last."
            helpText="Small print shown at bottom"
          />
        </BlockStack>
      </BlockStack>
    </Card>
  );

  // Render right panel - Live Preview
  const renderPreviewPanel = () => (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h3" variant="headingMd">Live Preview</Text>
          <Badge tone="info">Timer Popup</Badge>
        </InlineStack>
        
        <Box
          padding="400"
          background="bg-surface-secondary"
          borderRadius="200"
          borderWidth="025"
          borderColor="border"
        >
          <div style={{
            background: timerConfig.backgroundColor,
            borderRadius: `${timerConfig.borderRadius}px`,
            padding: "20px",
            color: timerConfig.textColor,
            textAlign: "center",
            maxWidth: "400px",
            margin: "0 auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Close button preview */}
            {timerConfig.showCloseButton && (
              <div style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                color: timerConfig.textColor
              }}>
                ×
              </div>
            )}

            <BlockStack gap="300">
              {/* Icon and Title */}
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>
                {timerConfig.timerIcon}
              </div>
              
              <Text as="h4" variant="headingMd" style={{ 
                color: timerConfig.textColor,
                fontSize: "20px",
                fontWeight: "700",
                margin: "0 0 10px 0"
              }}>
                {timerConfig.title}
              </Text>
              
              <Text as="p" variant="bodyMd" style={{ 
                color: timerConfig.textColor,
                opacity: 0.9,
                fontSize: "14px",
                lineHeight: "1.5",
                marginBottom: "20px"
              }}>
                {timerConfig.description}
              </Text>

              {/* Timer Display Preview */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "20px",
                flexWrap: "wrap"
              }}>
                {timerConfig.timerDays > 0 && (
                  <div style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    padding: "12px 10px",
                    borderRadius: "8px",
                    minWidth: "50px",
                    fontSize: "10px"
                  }}>
                    <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "4px" }}>
                      {timerConfig.timerDays.toString().padStart(2, '0')}
                    </div>
                    <div style={{ opacity: 0.8, fontSize: "10px" }}>DAYS</div>
                  </div>
                )}
                <div style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  padding: "12px 10px",
                  borderRadius: "8px",
                  minWidth: "50px",
                  fontSize: "10px"
                }}>
                  <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "4px" }}>
                    {timerConfig.timerHours.toString().padStart(2, '0')}
                  </div>
                  <div style={{ opacity: 0.8, fontSize: "10px" }}>HOURS</div>
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  padding: "12px 10px",
                  borderRadius: "8px",
                  minWidth: "50px",
                  fontSize: "10px"
                }}>
                  <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "4px" }}>
                    {timerConfig.timerMinutes.toString().padStart(2, '0')}
                  </div>
                  <div style={{ opacity: 0.8, fontSize: "10px" }}>MIN</div>
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(10px)",
                  padding: "12px 10px",
                  borderRadius: "8px",
                  minWidth: "50px",
                  fontSize: "10px"
                }}>
                  <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "4px" }}>
                    {timerConfig.timerSeconds.toString().padStart(2, '0')}
                  </div>
                  <div style={{ opacity: 0.8, fontSize: "10px" }}>SEC</div>
                </div>
              </div>

              {/* Email Input Preview */}
              <div style={{
                padding: "12px 16px",
                border: "none",
                borderRadius: "25px",
                backgroundColor: "rgba(255,255,255,0.9)",
                color: "#666",
                marginBottom: "15px",
                fontSize: "14px",
                width: "100%",
                boxSizing: "border-box"
              }}>
                {timerConfig.placeholder}
              </div>

              {/* CTA Button Preview */}
              <button style={{
                backgroundColor: "#ff6b6b",
                color: "#fff",
                padding: "14px 24px",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                width: "100%",
                boxShadow: "0 4px 15px rgba(255,107,107,0.4)"
              }}>
                {timerConfig.buttonText}
              </button>

              {/* Disclaimer Preview */}
              {timerConfig.disclaimer && (
                <div style={{
                  fontSize: "11px",
                  opacity: 0.7,
                  marginTop: "15px",
                  color: timerConfig.textColor
                }}>
                  {timerConfig.disclaimer}
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
                • Timer will count down in real-time on storefront
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                • Colors and gradients update instantly
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                • Test different timer durations for urgency
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                • Mobile responsive design included
              </Text>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Card>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Timer Popup Configuration"
      size="large"
      primaryAction={{
        content: "Save Configuration",
        onAction: handleSave,
      }}
      secondaryActions={[
        {
          content: "Preview on Storefront",
          onAction: handlePreviewStorefront,
        },
        {
          content: "Close",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <Layout>
          <Layout.Section>
            {renderSettingsPanel()}
          </Layout.Section>
          <Layout.Section variant="oneThird">
            {renderPreviewPanel()}
          </Layout.Section>
        </Layout>
      </Modal.Section>
    </Modal>
  );
}