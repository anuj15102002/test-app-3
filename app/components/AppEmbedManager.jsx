import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Card,
  BlockStack,
  Text,
  Button,
  InlineStack,
  Badge,
  Icon,
  Banner,
  Spinner,
  Box,
} from "@shopify/polaris";
import { ExternalIcon, CheckCircleIcon, AlertCircleIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";

export default function AppEmbedManager({ onEmbedStatusChange }) {
  const [embedStatus, setEmbedStatus] = useState({
    loading: true,
    enabled: false,
    themeId: null,
    themeName: null,
    enableUrl: null,
    error: null
  });
  
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  // Check embed status on component mount
  useEffect(() => {
    checkEmbedStatus();
  }, []);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        setEmbedStatus(prev => ({
          ...prev,
          loading: false,
          enabled: fetcher.data.appEmbedEnabled,
          themeId: fetcher.data.themeId,
          themeName: fetcher.data.themeName,
          enableUrl: fetcher.data.enableUrl,
          error: null
        }));
        
        // Notify parent component about embed status change
        if (onEmbedStatusChange) {
          onEmbedStatusChange(fetcher.data.appEmbedEnabled);
        }
        
        if (fetcher.data.enableUrl && fetcher.state === "idle" && fetcher.data.message) {
          // This means we got a redirect URL from the enable action
          handleRedirectToThemeEditor(fetcher.data.enableUrl);
        }
      } else {
        setEmbedStatus(prev => ({
          ...prev,
          loading: false,
          error: fetcher.data.error
        }));
        
        if (fetcher.data.error) {
          shopify.toast.show(`Error: ${fetcher.data.error}`, { isError: true });
        }
      }
    }
  }, [fetcher.data, fetcher.state, onEmbedStatusChange, shopify]);

  const checkEmbedStatus = () => {
    setEmbedStatus(prev => ({ ...prev, loading: true }));
    fetcher.load("/api/admin/theme-extension-status");
  };

  const handleEnableAppEmbed = () => {
    fetcher.submit(
      { action: "enable" },
      { method: "POST", action: "/api/admin/theme-extension-status" }
    );
  };

  const handleRedirectToThemeEditor = (enableUrl) => {
    // Open theme editor in new tab
    window.open(enableUrl, '_blank', 'noopener,noreferrer');
    
    // Show instructions to user
    shopify.toast.show("Theme editor opened. Please enable the popup block and return to save your configuration.");
    
    // Set up a timer to recheck status after user returns
    setTimeout(() => {
      checkEmbedStatus();
    }, 5000);
  };

  const renderEmbedStatus = () => {
    if (embedStatus.loading) {
      return (
        <InlineStack gap="200" align="center">
          <Spinner size="small" />
          <Text variant="bodyMd">Checking app embed status...</Text>
        </InlineStack>
      );
    }

    if (embedStatus.error) {
      return (
        <Banner tone="critical">
          <Text variant="bodyMd">
            Error checking app embed status: {embedStatus.error}
          </Text>
        </Banner>
      );
    }

    return (
      <InlineStack gap="300" align="space-between">
        <InlineStack gap="200" align="center">
          <Icon 
            source={embedStatus.enabled ? CheckCircleIcon : AlertCircleIcon} 
            tone={embedStatus.enabled ? "success" : "critical"}
          />
          <BlockStack gap="100">
            <Text variant="bodyMd" fontWeight="medium">
              App Embed Status: {embedStatus.enabled ? "Enabled" : "Disabled"}
            </Text>
            {embedStatus.themeName && (
              <Text variant="bodySm" tone="subdued">
                Theme: {embedStatus.themeName}
              </Text>
            )}
          </BlockStack>
        </InlineStack>
        
        <InlineStack gap="200">
          <Badge tone={embedStatus.enabled ? "success" : "critical"}>
            {embedStatus.enabled ? "Active" : "Inactive"}
          </Badge>
          <Button 
            size="small" 
            onClick={checkEmbedStatus}
            loading={fetcher.state === "loading"}
          >
            Refresh
          </Button>
        </InlineStack>
      </InlineStack>
    );
  };

  const renderActionSection = () => {
    if (embedStatus.loading || embedStatus.error) {
      return null;
    }

    if (embedStatus.enabled) {
      return (
        <Banner tone="success">
          <BlockStack gap="200">
            <Text variant="bodyMd">
              ✅ Your popup app is enabled on your storefront! You can now save and manage your popup configurations.
            </Text>
            <Text variant="bodySm" tone="subdued">
              The popup will appear on your storefront according to your configuration settings.
            </Text>
          </BlockStack>
        </Banner>
      );
    }

    return (
      <Banner tone="warning">
        <BlockStack gap="300">
          <Text variant="bodyMd">
            ⚠️ Your popup app is not enabled on your storefront. You need to enable it in your theme editor before you can save popup configurations.
          </Text>
          
          <Text variant="bodySm" tone="subdued">
            Click the button below to open your theme editor where you can add the popup block to your theme.
          </Text>
          
          <InlineStack gap="200">
            <Button
              variant="primary"
              onClick={handleEnableAppEmbed}
              loading={fetcher.state === "submitting"}
              icon={ExternalIcon}
            >
              Enable App Embed
            </Button>
            <Button
              variant="secondary"
              onClick={checkEmbedStatus}
              loading={fetcher.state === "loading"}
            >
              Check Status
            </Button>
          </InlineStack>
          
          <Box paddingBlockStart="200">
            <Text variant="bodySm" tone="subdued">
              <strong>Instructions:</strong>
              <br />
              1. Click "Enable App Embed" to open the theme editor
              <br />
              2. In the theme editor, add the "Popup Customizer" block to your theme
              <br />
              3. Save your theme changes
              <br />
              4. Return here and click "Check Status" to verify
            </Text>
          </Box>
        </BlockStack>
      </Banner>
    );
  };

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            App Embed Management
          </Text>
          <Text variant="bodyMd" tone="subdued">
            Your popup app must be enabled on your storefront theme to work properly.
          </Text>
        </BlockStack>
        
        {renderEmbedStatus()}
        {renderActionSection()}
      </BlockStack>
    </Card>
  );
}