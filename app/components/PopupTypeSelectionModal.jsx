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
import { getPopupTypesWithImages } from "../utils/popupImages";

export default function PopupTypeSelectionModal({ active, onClose, existingConfig }) {
  const [selectedPopupType, setSelectedPopupType] = useState(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [popupName, setPopupName] = useState("");
  const [showCreationModal, setShowCreationModal] = useState(false);

  const popupTypes = getPopupTypesWithImages();

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
            <Layout>
              {popupTypes.map((popup) => (
                <Layout.Section key={popup.type} variant="oneThird">
                  <Card>
                    <BlockStack gap="400" inlineAlign="center">
                      {/* Large popup preview image with fixed dimensions */}
                      <Box
                        padding="400"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "280px", // Fixed height for consistency
                          overflow: "hidden"
                        }}
                      >
                        <img
                          src={popup.image}
                          alt={popup.title}
                          style={{
                            width: "260px", // Fixed width
                            height: "200px", // Fixed height
                            objectFit: "cover", // Cover to fill the exact dimensions
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
                          }}
                        />
                      </Box>
                      
                      {/* Simple title with fixed height */}
                      <Box style={{ height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Text as="h3" variant="headingMd" alignment="center">
                          {popup.title.replace(" Popup", "")}
                        </Text>
                      </Box>
                      
                      {/* Create button */}
                      <Button
                        variant="primary"
                        onClick={() => handleSelectPopupType(popup.type)}
                        size="large"
                        fullWidth
                      >
                        Create popup
                      </Button>
                    </BlockStack>
                  </Card>
                </Layout.Section>
              ))}
            </Layout>
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