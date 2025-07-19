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
  Badge,
  Banner,
  ProgressBar,
  Modal,
  Icon,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { CheckIcon, AlertTriangleIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import PopupModal from "../components/PopupModal";
import CreatePopupButton from "../components/CreatePopupButton";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Load existing popup configuration if it exists
    let existingConfig = await db.popupConfig.findUnique({
      where: { shop: session.shop }
    });
    
    // Check setup progress
    const setupProgress = {
      appEmbedEnabled: existingConfig ? true : false,
      popupCreated: existingConfig ? true : false,
      popupPublished: existingConfig ? existingConfig.isActive : false,
    };
    
    // Calculate completion percentage
    const completedSteps = Object.values(setupProgress).filter(Boolean).length;
    const totalSteps = Object.keys(setupProgress).length;
    const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
    
    return { 
      existingConfig, 
      setupProgress,
      completionPercentage,
      storeName: session.shop.replace('.myshopify.com', ''),
    };
  } catch (error) {
    return { 
      existingConfig: null, 
      setupProgress: {
        appEmbedEnabled: false,
        popupCreated: false,
        popupPublished: false,
      },
      completionPercentage: 0,
      storeName: 'Your Store',
    };
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  
  if (actionType === "publishPopup") {
    try {
      const updatedConfig = await db.popupConfig.update({
        where: { shop: session.shop },
        data: { isActive: true }
      });
      
      return { success: true, message: "Popup published successfully!" };
    } catch (error) {
      return { success: false, error: `Failed to publish popup: ${error.message}` };
    }
  }
  
  return { success: false, error: "Invalid action" };
};

export default function AdminHome() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const loaderData = useLoaderData();
  const { existingConfig, setupProgress, completionPercentage, storeName } = loaderData;
  

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        shopify.toast.show(fetcher.data.message);
      } else if (fetcher.data.error) {
        shopify.toast.show(`Error: ${fetcher.data.error}`, { isError: true });
      }
    }
  }, [fetcher.data, shopify]);

  const handlePublishPopup = useCallback(() => {
    fetcher.submit(
      { actionType: "publishPopup" },
      { method: "POST" }
    );
  }, [fetcher]);


  const handleNavigateToCustomizer = useCallback(() => {
    navigate("/app/popup-customizer");
  }, [navigate]);

  return (
    <Page>
      <TitleBar title="EcomSend Popups">
        <CreatePopupButton existingConfig={existingConfig} />
      </TitleBar>
      
      <BlockStack gap="500">
        {/* Welcome Message */}
        <Card>
          <BlockStack gap="300">
            <Text as="h1" variant="headingLg">
              Welcome to {storeName}!
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              Get started with creating engaging popups to boost your conversions and grow your email list.
            </Text>
          </BlockStack>
        </Card>

        {/* Create/Configure Popup Section */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between">
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Popup Management
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Create new popups or configure your existing popup settings and customize the appearance.
                </Text>
              </BlockStack>
              <CreatePopupButton existingConfig={existingConfig} size="large" />
            </InlineStack>
            
            {existingConfig && (
              <Box paddingBlockStart="300">
                <InlineStack gap="300">
                  <PopupModal existingConfig={existingConfig} />
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Configure your existing {existingConfig.type} popup
                  </Text>
                </InlineStack>
              </Box>
            )}
            
            {!existingConfig && (
              <Box paddingBlockStart="300">
                <Text variant="bodyMd" as="p" tone="subdued">
                  No popup created yet. Click "Create Popup" to get started with your first popup.
                </Text>
              </Box>
            )}
          </BlockStack>
        </Card>

        {/* Promotional Banner (like Trustoo.io) */}
        <Banner
          title="🚀 Trustoo.io: Product Reviews"
          status="info"
          onDismiss={() => {}}
        >
          <Text variant="bodyMd">
            Collect reviews with custom-branded email templates, boost repeat purchases with discount rewards, 
            sync Google Shopping to drive sales and build trust with powerful social proof.
          </Text>
          <Box paddingBlockStart="300">
            <Button size="slim" variant="primary">
              Start for free
            </Button>
          </Box>
        </Banner>

        {/* Feedback Banner */}
        <Banner
          title="💙 Your feedback means a lot to us!"
          status="success"
        >
          <Text variant="bodyMd">
            Take a minute to share your experience with EcomSend.
          </Text>
          <Box paddingBlockStart="200">
            <InlineStack gap="200">
              <Text variant="bodyMd">⭐⭐⭐⭐⭐</Text>
            </InlineStack>
          </Box>
        </Banner>

        <Layout>
          <Layout.Section>
            {/* Quick Setup Guide */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Quick setup guide
                  </Text>
                  <Button variant="plain" icon="external">
                    <Text variant="bodyMd" tone="subdued">⋯</Text>
                  </Button>
                </InlineStack>
                
                <Text variant="bodyMd" tone="subdued">
                  {Object.values(setupProgress).filter(Boolean).length} of {Object.keys(setupProgress).length} tasks complete
                </Text>
                
                <ProgressBar 
                  progress={completionPercentage} 
                  size="small"
                />
                
                <BlockStack gap="300">
                  {/* Step 1: Enable app embed */}
                  <InlineStack align="space-between">
                    <InlineStack gap="300" align="center">
                      <Icon 
                        source={setupProgress.appEmbedEnabled ? CheckIcon : AlertTriangleIcon} 
                        tone={setupProgress.appEmbedEnabled ? "success" : "subdued"}
                      />
                      <Text variant="bodyMd">
                        Enable app embed
                      </Text>
                    </InlineStack>
                    {setupProgress.appEmbedEnabled && (
                      <Badge tone="success">Complete</Badge>
                    )}
                  </InlineStack>

                  {/* Step 2: Create a popup */}
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <InlineStack gap="300" align="center">
                        <Icon
                          source={setupProgress.popupCreated ? CheckIcon : AlertTriangleIcon}
                          tone={setupProgress.popupCreated ? "success" : "subdued"}
                        />
                        <Text variant="bodyMd">
                          Create a popup
                        </Text>
                      </InlineStack>
                      {setupProgress.popupCreated && (
                        <Badge tone="success">Complete</Badge>
                      )}
                    </InlineStack>
                    
                    {/* Add button for popup management */}
                    <Box paddingInlineStart="800">
                      <div style={{ display: "inline-block" }}>
                        <PopupModal existingConfig={existingConfig} />
                      </div>
                    </Box>
                  </BlockStack>

                  {/* Step 3: Publish popup */}
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <InlineStack gap="300" align="center">
                        <Icon 
                          source={setupProgress.popupPublished ? CheckIcon : AlertTriangleIcon} 
                          tone={setupProgress.popupPublished ? "success" : "subdued"}
                        />
                        <Text variant="bodyMd">
                          Publish your popup
                        </Text>
                      </InlineStack>
                      {setupProgress.popupPublished && (
                        <Badge tone="success">Complete</Badge>
                      )}
                    </InlineStack>
                    
                    {!setupProgress.popupPublished && setupProgress.popupCreated && (
                      <Box paddingInlineStart="800">
                        <BlockStack gap="200">
                          <Text variant="bodyMd" tone="subdued">
                            Publish your popup and that's it!
                          </Text>
                          <Text variant="bodyMd" tone="subdued">
                            Sit back and let the app do the hard work for you. Feel free to contact us if you have 
                            any questions or concerns, we are 24/7.
                          </Text>
                          <Box paddingBlockStart="200">
                            <Button 
                              onClick={handlePublishPopup}
                              variant="primary"
                              size="slim"
                            >
                              Publish popup
                            </Button>
                          </Box>
                        </BlockStack>
                      </Box>
                    )}
                    
                    {/* Celebration illustration placeholder */}
                    {setupProgress.popupPublished && (
                      <Box paddingInlineStart="800">
                        <InlineStack gap="200" align="center">
                          <Text variant="bodyMd">🎉</Text>
                          <Text variant="bodyMd" tone="success">
                            Your popup is now live!
                          </Text>
                        </InlineStack>
                      </Box>
                    )}
                  </BlockStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            {/* App Embed Status */}
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h3" variant="headingMd">
                    App embed
                  </Text>
                  <Badge tone={setupProgress.appEmbedEnabled ? "success" : "critical"}>
                    {setupProgress.appEmbedEnabled ? "Active" : "Inactive"}
                  </Badge>
                </InlineStack>
                
                <Text variant="bodyMd" tone="subdued">
                  {setupProgress.appEmbedEnabled 
                    ? "Popup functionality is enabled in your online store"
                    : "Enable the app embed to activate popup functionality"
                  }
                </Text>
                
                {!setupProgress.appEmbedEnabled && (
                  <Button variant="primary" size="slim">
                    Enable App Embed
                  </Button>
                )}
                
                {setupProgress.appEmbedEnabled && (
                  <Button variant="plain" size="slim">
                    Managing app embeds
                  </Button>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>

    </Page>
  );
}