import { useState, useCallback, useEffect } from "react";
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
  Badge,
  Banner,
  EmptyState,
  ButtonGroup,
  Modal,
  TextField,
  Thumbnail,
  Icon,
  Popover,
  ActionList,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import PopupTypeSelectionModal from "../components/PopupTypeSelectionModal";
import PopupConfigurationModal from "../components/PopupConfigurationModal";
import { getPopupImagePath } from "../utils/popupImages";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  try {
    // Load all popups for this shop
    const popups = await db.popupConfig.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: 'desc' }
    });
    
    return { 
      popups,
      shop: session.shop
    };
  } catch (error) {
    console.error("Error loading popups:", error);
    return { 
      popups: [],
      shop: session.shop
    };
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const popupId = formData.get("popupId");
  
  try {
    if (actionType === "toggleActive") {
      const isActive = formData.get("isActive") === "true";
      
      await db.popupConfig.update({
        where: { id: popupId },
        data: { isActive: !isActive }
      });
      
      return { 
        success: true, 
        message: `Popup ${!isActive ? 'activated' : 'deactivated'} successfully!` 
      };
    }
    
    if (actionType === "deletePopup") {
      await db.popupConfig.delete({
        where: { id: popupId }
      });
      
      return { 
        success: true, 
        message: "Popup deleted successfully!" 
      };
    }
    
    if (actionType === "updateName") {
      const newName = formData.get("newName");
      
      await db.popupConfig.update({
        where: { id: popupId },
        data: { name: newName }
      });
      
      return { 
        success: true, 
        message: "Popup name updated successfully!" 
      };
    }
    
    return { success: false, error: "Invalid action" };
  } catch (error) {
    console.error("Action error:", error);
    return { success: false, error: error.message };
  }
};

export default function PopupsPage() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const { popups } = useLoaderData();
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [namePopupId, setNamePopupId] = useState(null);
  const [activePopover, setActivePopover] = useState(null);

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

  const handleToggleActive = useCallback((popup) => {
    fetcher.submit(
      { 
        actionType: "toggleActive", 
        popupId: popup.id,
        isActive: popup.isActive.toString()
      },
      { method: "POST" }
    );
  }, [fetcher]);

  const handleEditPopup = useCallback((popup) => {
    setEditingPopup(popup);
    setShowEditModal(true);
  }, []);

  const handleDeletePopup = useCallback((popupId) => {
    if (confirm("Are you sure you want to delete this popup? This action cannot be undone.")) {
      fetcher.submit(
        { actionType: "deletePopup", popupId },
        { method: "POST" }
      );
    }
  }, [fetcher]);

  const handleEditName = useCallback((popup) => {
    setEditingName(popup.name);
    setNamePopupId(popup.id);
    setShowNameModal(true);
  }, []);

  const handleSaveName = useCallback(() => {
    if (editingName.trim()) {
      fetcher.submit(
        { 
          actionType: "updateName", 
          popupId: namePopupId,
          newName: editingName.trim()
        },
        { method: "POST" }
      );
      setShowNameModal(false);
      setEditingName("");
      setNamePopupId(null);
    }
  }, [fetcher, editingName, namePopupId]);

  const getPopupTypeLabel = (type) => {
    switch (type) {
      case "email": return "Email Discount";
      case "wheel-email": return "Wheel + Email";
      case "community": return "Community Social";
      case "timer": return "Timer Countdown";
      case "scratch-card": return "Scratch Card";
      default: return type;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPopupThumbnail = (popup) => {
    return getPopupImagePath(popup.type);
  };

  return (
    <Page>
      <TitleBar title="QuickPop" />
      
      <BlockStack gap="500">
        {/* Header */}
        <InlineStack align="space-between">
          <Text as="h1" variant="headingLg">
            Popups
          </Text>
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => setShowCreateModal(true)}
          >
            Create popup
          </Button>
        </InlineStack>

        

        {/* Popup Library */}
        <BlockStack gap="400">
          
          
          {popups.length === 0 ? (
            <Card>
              <EmptyState
                heading="Create your first popup"
                action={{
                  content: "Create popup",
                  onAction: () => setShowCreateModal(true)
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>
                  Start engaging your customers with beautiful popups.
                  Choose from email capture, spinning wheels, social media, and countdown timers.
                </p>
              </EmptyState>
            </Card>
          ) : (
            <Card>
  <BlockStack gap="0">
    {popups.map((popup, index) => (
      <div key={popup.id}>
        <Box padding="200">
          <InlineStack gap="400" align="space-between" blockAlign="center">
            
            {/* ✅ Left: Thumbnail + Details */}
            <InlineStack gap="300" align="center">
              <Thumbnail
                source={getPopupThumbnail(popup)}
                alt={popup.name}
                size="large"
              />

              <BlockStack gap="050">
                <Text as="h3" variant="headingSm" fontWeight="semibold">
                  {popup.name && popup.name.length > 30 ? `${popup.name.substring(0, 30)}...` : popup.name}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Created: {formatDate(popup.createdAt)}
                </Text>
                <Text variant="bodySm" tone="subdued">
                  Last saved: {formatDate(popup.updatedAt || popup.createdAt)}
                </Text>
              </BlockStack>
            </InlineStack>

            {/* ✅ Middle: Stats */}
            <InlineStack gap="600" align="center">
              <BlockStack gap="025" inlineAlign="center">
                <Text variant="bodySm" tone="subdued">Popup views</Text>
                <Text variant="bodyMd" fontWeight="semibold">-</Text>
              </BlockStack>
              <BlockStack gap="025" inlineAlign="center">
                <Text variant="bodySm" tone="subdued">Subscribers</Text>
                <Text variant="bodyMd" fontWeight="semibold">-</Text>
              </BlockStack>
              <BlockStack gap="025" inlineAlign="center">
                <Text variant="bodySm" tone="subdued">Conversion rate</Text>
                <Text variant="bodyMd" fontWeight="semibold">0%</Text>
              </BlockStack>
            </InlineStack>

            {/* ✅ Right: Toggle + Actions */}
            <InlineStack gap="600" align="center">
              {/* Toggle Switch */}
              <input
                type="checkbox"
                checked={popup.isActive}
                onChange={() => handleToggleActive(popup)}
                style={{
                  width: '40px',
                  height: '20px',
                  appearance: 'none',
                  backgroundColor: popup.isActive ? '#008060' : '#E1E3E5',
                  borderRadius: '10px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: '0.2s',
                }}
              />

              {/* ✅ Buttons */}
              <InlineStack gap="100">
                <Button
                  onClick={() => handleEditPopup(popup)}
                  variant="primary"
                  size="medium"  // ✅ Changed to medium for normal look
                >
                  Customize
                </Button>

                <Popover
                  active={activePopover === popup.id}
                  activator={
                    <Button
                      variant="plain"
                      size="medium"
                      onClick={() =>
                        setActivePopover(
                          activePopover === popup.id ? null : popup.id
                        )
                      }
                    >
                      •••
                    </Button>
                  }
                  onClose={() => setActivePopover(null)}
                >
                  <ActionList
                    items={[
                      {
                        content: 'Edit name',
                        onAction: () => {
                          handleEditName(popup);
                          setActivePopover(null);
                        },
                      },
                      {
                        content: 'Delete',
                        destructive: true,
                        onAction: () => {
                          handleDeletePopup(popup.id);
                          setActivePopover(null);
                        },
                      },
                    ]}
                  />
                </Popover>
              </InlineStack>
            </InlineStack>
          </InlineStack>
        </Box>

        {/* Divider between items */}
        {index < popups.length - 1 && (
          <Box borderBlockEndWidth="025" borderColor="border" />
        )}
      </div>
    ))}
  </BlockStack>
</Card>

          )}
        </BlockStack>

        {/* Footer */}
        
      </BlockStack>

      {/* Create Popup Modal */}
      <PopupTypeSelectionModal
        active={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        existingConfig={null}
      />

      {/* Edit Popup Modal */}
      {showEditModal && editingPopup && (
        <PopupConfigurationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingPopup(null);
          }}
          initialConfig={editingPopup}
          initialPopupType={editingPopup.type}
        />
      )}

      {/* Edit Name Modal */}
      <Modal
        open={showNameModal}
        onClose={() => setShowNameModal(false)}
        title="Edit Popup Name"
        primaryAction={{
          content: "Save",
          onAction: handleSaveName,
          disabled: !editingName.trim()
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowNameModal(false)
          }
        ]}
      >
        <Modal.Section>
          <TextField
            label="Popup Name"
            value={editingName}
            onChange={(value) => setEditingName(value.slice(0, 50))}
            placeholder="Enter popup name"
            maxLength={50}
            showCharacterCount
            helpText="Maximum 50 characters"
            autoComplete="off"
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}