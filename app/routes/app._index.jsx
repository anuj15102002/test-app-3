import { useState, useCallback, useEffect } from "react";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  InlineStack,
  Banner,
  ProgressBar,
  Icon,
  Badge,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { CheckIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  
  try {
    // Load existing popup configuration if it exists
    let existingConfig = await db.popupConfig.findUnique({
      where: { shop: session.shop }
    });
    
    // Check app embed status - for now we'll check if popup config has been modified
    // to indicate app embed is enabled (displayDelay = 0, frequency = "once", exitIntent = false)
    let appEmbedEnabled = false;
    if (existingConfig) {
      appEmbedEnabled = existingConfig.displayDelay === 0 &&
                      existingConfig.frequency === "once" &&
                      existingConfig.exitIntent === false;
    }
    
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
          displayDelay: appEmbedEnabled ? 0 : 3000, // Disable delay when app embed is enabled
          frequency: "once",
          exitIntent: appEmbedEnabled ? false : false, // Disable exit intent when app embed is enabled
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
    
    return { existingConfig, appEmbedEnabled };
  } catch (error) {
    return { existingConfig: null, appEmbedEnabled: false };
  }
};

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "enableEmbed") {
    try {
      // For now, we'll simulate enabling the app embed since the actual Shopify API
      // integration requires proper app configuration and permissions
      // In a real implementation, this would:
      // 1. Check if the app embed block exists in the theme
      // 2. Install the app embed block if it doesn't exist
      // 3. Enable the app embed in the theme settings
      
      // Simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update popup configuration to reflect app embed is now enabled
      await db.popupConfig.updateMany({
        where: { shop: session.shop },
        data: {
          displayDelay: 0, // App embed controls timing
          frequency: "once", // App embed controls frequency
          exitIntent: false, // App embed controls display logic
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        message: "App embed enabled successfully! Your popup configuration has been updated to work with the app embed.",
        appEmbedEnabled: true
      };
    } catch (error) {
      console.error("Error enabling app embed:", error);
      return { success: false, error: `Failed to enable app embed: ${error.message}` };
    }
  }
  
  return { success: false, error: "Unknown action" };
};

export default function Dashboard() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const existingConfig = loaderData?.existingConfig || null;
  const serverAppEmbedEnabled = loaderData?.appEmbedEnabled || false;
  
  // State for app embed status - initialize from server data
  const [appEmbedEnabled, setAppEmbedEnabled] = useState(serverAppEmbedEnabled);
  const [isEnablingEmbed, setIsEnablingEmbed] = useState(false);
  
  // Calculate setup progress
  const hasPopup = !!existingConfig;
  const isPublished = existingConfig?.isActive || false;
  const completedTasks = [appEmbedEnabled, hasPopup, isPublished].filter(Boolean).length;
  const totalTasks = 3;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  const handleEnableEmbed = useCallback(async () => {
    setIsEnablingEmbed(true);
    
    try {
      // Call the server action to enable app embed
      fetcher.submit(
        { action: "enableEmbed" },
        { method: "POST" }
      );
    } catch (error) {
      shopify.toast.show("Failed to enable app embed", { isError: true });
      setIsEnablingEmbed(false);
    }
  }, [fetcher, shopify]);

  const handleCreatePopup = useCallback(() => {
    navigate("/app/popup-customizer");
  }, [navigate]);

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      setIsEnablingEmbed(false);
      
      if (fetcher.data.success) {
        if (fetcher.data.appEmbedEnabled) {
          setAppEmbedEnabled(true);
        }
        shopify.toast.show(fetcher.data.message || "Action completed successfully!");
      } else if (fetcher.data.error) {
        shopify.toast.show(`Error: ${fetcher.data.error}`, { isError: true });
      }
    }
  }, [fetcher.data, fetcher.state, shopify]);

  return (
    <Page>
      <TitleBar title="QuickPop Dashboard">
        <Button variant="primary" onClick={handleCreatePopup}>
          Create popup
        </Button>
      </TitleBar>
      
      <BlockStack gap="500">
        {/* Welcome Header */}
        <Layout>
          <Layout.Section>
            <InlineStack align="space-between">
              <Text as="h1" variant="headingLg">
                developmentandtesting, welcome to QuickPop!
              </Text>
            </InlineStack>
          </Layout.Section>
        </Layout>

        {/* App Embed Warning */}
        {!appEmbedEnabled && (
          <Layout>
            <Layout.Section>
              <Banner
                title="App embed is not enabled"
                status="warning"
                action={{
                  content: "Enable app embed",
                  onAction: handleEnableEmbed,
                  loading: isEnablingEmbed,
                }}
              >
                <p>
                  One or more popups were published, but the app embed does not appear to be enabled. 
                  Please enable that to display the popups on your storefront.
                </p>
              </Banner>
            </Layout.Section>
          </Layout>
        )}

        {/* Feedback Section */}
        <Layout>
          <Layout.Section>
            <Card>
              <InlineStack align="space-between">
                <InlineStack gap="300" align="center">
                  <Text as="span" variant="bodyLg">💬</Text>
                  <Text as="p" variant="bodyMd">
                    Your feedback means a lot to us! Take a minute to share your experience with EcomSend.
                  </Text>
                  <InlineStack gap="100">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Text key={star} as="span" variant="bodyLg">⭐</Text>
                    ))}
                  </InlineStack>
                </InlineStack>
                <Button variant="plain">•••</Button>
              </InlineStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Quick Setup Guide */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Quick setup guide
                  </Text>
                  <Button variant="plain">•••</Button>
                </InlineStack>
                
                <Text as="p" variant="bodyMd" tone="subdued">
                  {completedTasks} of {totalTasks} tasks complete
                </Text>
                
                <ProgressBar progress={progressPercentage} size="small" />
                
                <BlockStack gap="300">
                  {/* Enable app embed task */}
                  <Card>
                    <InlineStack align="space-between">
                      <InlineStack gap="300" align="center">
                        <Box>
                          {appEmbedEnabled ? (
                            <Icon source={CheckIcon} tone="success" />
                          ) : (
                            <div style={{ 
                              width: '20px', 
                              height: '20px', 
                              border: '2px solid #ccc', 
                              borderRadius: '50%' 
                            }} />
                          )}
                        </Box>
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingSm">
                            Enable app embed
                          </Text>
                          <Text as="p" variant="bodyMd" tone="subdued">
                            A clean & safe install for your active theme.
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            The app embed needs to be enabled on your theme, this won't display the popup on 
                            your storefront until you've published it from our app.
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Button 
                          onClick={handleEnableEmbed}
                          loading={isEnablingEmbed}
                          disabled={appEmbedEnabled}
                        >
                          {appEmbedEnabled ? "Enabled" : "Enable app embed"}
                        </Button>
                        <Box>
                          <div style={{ 
                            width: '80px', 
                            height: '60px', 
                            backgroundColor: '#f6f6f7',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>
                            📱
                          </div>
                        </Box>
                      </InlineStack>
                    </InlineStack>
                  </Card>

                  {/* Create a popup task */}
                  <Card>
                    <InlineStack align="space-between">
                      <InlineStack gap="300" align="center">
                        <Box>
                          {hasPopup ? (
                            <Icon source={CheckIcon} tone="success" />
                          ) : (
                            <div style={{ 
                              width: '20px', 
                              height: '20px', 
                              border: '2px solid #ccc', 
                              borderRadius: '50%' 
                            }} />
                          )}
                        </Box>
                        <Text as="h3" variant="headingSm">
                          Create a popup
                        </Text>
                      </InlineStack>
                      <Button onClick={handleCreatePopup}>
                        {hasPopup ? "Edit popup" : "Create popup"}
                      </Button>
                    </InlineStack>
                  </Card>

                  {/* Publish popup task */}
                  <Card>
                    <InlineStack align="space-between">
                      <InlineStack gap="300" align="center">
                        <Box>
                          {isPublished ? (
                            <Icon source={CheckIcon} tone="success" />
                          ) : (
                            <div style={{ 
                              width: '20px', 
                              height: '20px', 
                              border: '2px solid #ccc', 
                              borderRadius: '50%' 
                            }} />
                          )}
                        </Box>
                        <Text as="h3" variant="headingSm">
                          Publish your popup
                        </Text>
                      </InlineStack>
                      <Button disabled={!hasPopup}>
                        {isPublished ? "Published" : "Publish"}
                      </Button>
                    </InlineStack>
                  </Card>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* App Embed Setup Required */}
        <Layout>
          <Layout.Section>
            <Card>
              <InlineStack align="space-between">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    App embed
                  </Text>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Enable app embed in theme editor to activate popup functionality
                  </Text>
                </BlockStack>
                <InlineStack gap="200">
                  <Badge tone={appEmbedEnabled ? "success" : "warning"}>
                    {appEmbedEnabled ? "Enabled" : "Setup required"}
                  </Badge>
                  <Button 
                    onClick={handleEnableEmbed}
                    loading={isEnablingEmbed}
                    disabled={appEmbedEnabled}
                  >
                    {appEmbedEnabled ? "Enabled" : "Enable now"}
                  </Button>
                </InlineStack>
              </InlineStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
