import { useState } from "react";
import {
  Modal,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { EmailIcon, ClockIcon } from "@shopify/polaris-icons";
import PopupCreationModal from "./PopupCreationModal";

export default function PopupTypeSelectionModal({ active, onClose, existingConfig }) {
  const [selectedPopupType, setSelectedPopupType] = useState(null);
  const [showCreationModal, setShowCreationModal] = useState(false);

  const popupTypes = [
    {
      type: "email",
      title: "Email Discount Popup",
      description: "Capture emails with discount offers to grow your subscriber list",
      icon: EmailIcon,
      color: "#007ace",
      features: ["Email capture", "Discount codes", "Customizable design", "Exit intent"]
    },
    {
      type: "wheel-email",
      title: "Wheel + Email Combo",
      description: "Interactive spinning wheel with email capture for higher engagement",
      icon: "🎡",
      color: "#1e40af",
      features: ["Spinning wheel", "Multiple prizes", "Email capture", "Gamification"]
    },
    {
      type: "community",
      title: "Community Social Popup",
      description: "Grow your social media following with attractive social icons",
      icon: "👥",
      color: "#10b981",
      features: ["Social media links", "Custom banner", "Multiple platforms", "Ask me later"]
    },
    {
      type: "timer",
      title: "Timer Countdown Popup",
      description: "Create urgency with countdown timers for limited-time offers",
      icon: ClockIcon,
      color: "#f59e0b",
      features: ["Countdown timer", "Urgency creation", "Email capture", "Custom expiry"]
    }
  ];

  const handleSelectPopupType = (type) => {
    setSelectedPopupType(type);
    setShowCreationModal(true);
    onClose(); // Close the selection modal
  };

  const handleCloseCreationModal = () => {
    setShowCreationModal(false);
    setSelectedPopupType(null);
  };

  return (
    <>
      <Modal
        open={active}
        onClose={onClose}
        title="Choose Your Popup Type"
        size="large"
        secondaryActions={[
          {
            content: "Cancel",
            onAction: onClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="500">
            <Text variant="bodyMd" as="p" tone="subdued">
              Select the type of popup you want to create. Each type is designed for different goals and engagement strategies.
            </Text>
            
            <Layout>
              {popupTypes.map((popup) => (
                <Layout.Section key={popup.type} variant="oneHalf">
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="start">
                        <InlineStack gap="300" align="center">
                          {typeof popup.icon === 'string' ? (
                            <Box
                              padding="200"
                              background="bg-surface-secondary"
                              borderRadius="100"
                              minWidth="40px"
                              minHeight="40px"
                            >
                              <Text as="span" variant="headingLg" alignment="center">
                                {popup.icon}
                              </Text>
                            </Box>
                          ) : (
                            <Box
                              padding="200"
                              background="bg-surface-secondary"
                              borderRadius="100"
                              minWidth="40px"
                              minHeight="40px"
                            >
                              <Icon source={popup.icon} tone="base" />
                            </Box>
                          )}
                          <BlockStack gap="100">
                            <Text as="h3" variant="headingMd">
                              {popup.title}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                      </InlineStack>
                      
                      <Text variant="bodyMd" as="p" tone="subdued">
                        {popup.description}
                      </Text>
                      
                      <BlockStack gap="200">
                        <Text as="h4" variant="headingSm">
                          Key Features:
                        </Text>
                        <BlockStack gap="100">
                          {popup.features.map((feature, index) => (
                            <InlineStack key={index} gap="200" align="center">
                              <Box
                                minWidth="6px"
                                minHeight="6px"
                                background="bg-fill-success"
                                borderRadius="100"
                              />
                              <Text variant="bodyMd" as="p">
                                {feature}
                              </Text>
                            </InlineStack>
                          ))}
                        </BlockStack>
                      </BlockStack>
                      
                      <Button
                        variant="primary"
                        onClick={() => handleSelectPopupType(popup.type)}
                        fullWidth
                      >
                        Create {popup.title}
                      </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>
              ))}
            </Layout>
            
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">
                  💡 Pro Tips:
                </Text>
                <BlockStack gap="100">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    • Email popups are great for first-time visitors and newsletter signups
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    • Wheel popups increase engagement and can boost conversion rates by 30%
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    • Social popups work best for brand awareness and community building
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    • Timer popups create urgency and are perfect for limited-time offers
                  </Text>
                </BlockStack>
              </BlockStack>
            </Box>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Popup Creation Modal */}
      {showCreationModal && selectedPopupType && (
        <PopupCreationModal
          active={showCreationModal}
          onClose={handleCloseCreationModal}
          existingConfig={existingConfig}
          initialPopupType={selectedPopupType}
        />
      )}
    </>
  );
}