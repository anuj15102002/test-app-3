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
  TextField,
} from "@shopify/polaris";
import { EmailIcon, ClockIcon } from "@shopify/polaris-icons";
import PopupConfigurationModal from "./PopupConfigurationModal";

export default function PopupTypeSelectionModal({ active, onClose, existingConfig }) {
  const [selectedPopupType, setSelectedPopupType] = useState(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [popupName, setPopupName] = useState("");
  const [showCreationModal, setShowCreationModal] = useState(false);

  const popupTypes = [
    {
      type: "email",
      title: "Email Discount Popup",
      description: "Capture emails with discount offers to grow your subscriber list",
      icon: EmailIcon,
      color: "#007ace",
      features: ["Email capture", "Discount codes", "Customizable design", "Exit intent"],
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
    },
    {
      type: "scratch-card",
      title: "Scratch Card Popup",
      description: "Interactive scratch-to-win experience with discount reveals",
      icon: "🎲",
      color: "#8b5cf6",
      features: ["Canvas scratch effect", "Random discounts", "Email capture", "Gamification"]
    }
  ];

  // const handleSelectPopupType = (type) => {
  //   setSelectedPopupType(type);
  //   setShowNameInput(true);
  //   // Generate a default name based on popup type
  //   const defaultName = `${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Popup - ${new Date().toLocaleDateString()}`;
  //   setPopupName(`${selectedPopupType.title} - ${new Date().toLocaleString()}`);

  // };

  const handleSelectPopupType = (type) => {
  setSelectedPopupType(type);

  const now = new Date();
  setPopupName(`${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} Popup - ${now.toLocaleString()}`); // Default unique name

  setShowNameInput(true);
};

  const handleNameConfirm = () => {
    if (popupName.trim()) {
      setShowNameInput(false);
      setShowCreationModal(true);
    }
  };

  const handleBackToTypeSelection = () => {
    setShowNameInput(false);
    setSelectedPopupType(null);
    setPopupName("");
  };

  const handleCloseCreationModal = () => {
    setShowCreationModal(false);
    setShowNameInput(false);
    setSelectedPopupType(null);
    setPopupName("");
    onClose(); // Close the selection modal when configuration modal is closed
  };

  const handleCloseAll = () => {
    setShowCreationModal(false);
    setShowNameInput(false);
    setSelectedPopupType(null);
    setPopupName("");
    onClose();
  };

  return (
    <>
      {/* Popup Type Selection Modal */}
      <Modal
        open={active && !showNameInput}
        onClose={handleCloseAll}
        title="Choose Your Popup Type"
        size="large"
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCloseAll,
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
                              style={{
          width: "320px",       // ✅ Fixed width for consistency
          minWidth: "320px",
          maxWidth: "320px",
          margin: "0 auto",     // ✅ Centers the card when single
        }}
                              
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

      {/* Popup Name Input Modal */}
      <Modal
        open={showNameInput}
        onClose={handleCloseAll}
        title={`Name Your ${selectedPopupType ? selectedPopupType.charAt(0).toUpperCase() + selectedPopupType.slice(1).replace('-', ' ') : ''} Popup`}
        primaryAction={{
          content: "Continue to Configuration",
          onAction: handleNameConfirm,
          disabled: !popupName.trim()
        }}
        secondaryActions={[
          {
            content: "Back",
            onAction: handleBackToTypeSelection,
          },
          {
            content: "Cancel",
            onAction: handleCloseAll,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodyMd" as="p">
              Give your popup a descriptive name to easily identify it in your popup management dashboard.
            </Text>
            
            <TextField
              label="Popup Name"
              value={popupName}
              onChange={(value) => setPopupName(value.slice(0, 50))}
              placeholder={`Enter a name for your ${selectedPopupType ? selectedPopupType.replace('-', ' ') : ''} popup`}
              maxLength={50}
              showCharacterCount
              helpText="This name will help you identify this popup in your management dashboard (max 50 characters)"
              autoComplete="off"
              autoFocus
            />
            
            <Box padding="300" background="bg-surface-secondary" borderRadius="200">
              <BlockStack gap="200">
                <Text as="h4" variant="headingSm">
                  💡 Naming Tips:
                </Text>
                <BlockStack gap="100">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    • Use descriptive names like "Holiday Sale Email Popup" or "Exit Intent Wheel"
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    • Include the purpose or campaign name for easy identification
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    • You can always change the name later from the management page
                  </Text>
                </BlockStack>
              </BlockStack>
            </Box>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Popup Configuration Modal */}
      {showCreationModal && selectedPopupType && (
        <PopupConfigurationModal
          isOpen={showCreationModal}
          onClose={handleCloseCreationModal}
          initialConfig={existingConfig}
          initialPopupType={selectedPopupType}
          initialPopupName={popupName}
        />
      )}
    </>
  );
}