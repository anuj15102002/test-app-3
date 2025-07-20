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
    // Generate different thumbnails based on popup type
    const thumbnails = {
      "email": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjEwIiB5PSIxNSIgd2lkdGg9IjgwIiBoZWlnaHQ9IjUwIiByeD0iNCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI0UxRTNFNSIvPgo8dGV4dCB4PSI1MCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjczODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4Ij7wn5OIPC90ZXh0Pgo8dGV4dCB4PSI1MCIgeT0iNDIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMzNzQxNTEiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI2Ij5FbWFpbCBQb3B1cDwvdGV4dD4KPHN2Zz4K",
      "wheel-email": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiBmaWxsPSJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjMWUzYzcyIDAlLCAjMmE1Mjk4IDEwMCUpIi8+CjxjaXJjbGUgY3g9IjMwIiBjeT0iNDAiIHI9IjE4IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2ZyB4PSIyNSIgeT0iMzUiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+CjxwYXRoIGQ9Ik01IDAgTDEwIDUgTDUgMTAgTDAgNSBaIiBmaWxsPSIjRkY2QjZCIi8+Cjwvc3ZnPgo8dGV4dCB4PSI3MCIgeT0iMzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNiI+U3BpbiB0byBXaW48L3RleHQ+CjxyZWN0IHg9IjU1IiB5PSI0NSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjgiIHJ4PSI0IiBmaWxsPSIjRkY2QjZCIi8+CjwvcmVjdD4KPHN2Zz4K",
      "community": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiByeD0iNCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI0UxRTNFNSIvPgo8cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIyMCIgZmlsbD0iIzY2N0VFQSIvPgo8dGV4dCB4PSI1MCIgeT0iNDUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiMzNzQxNTEiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4Ij7wn5G1IEpvaW4gVXM8L3RleHQ+CjxjaXJjbGUgY3g9IjM1IiBjeT0iNTUiIHI9IjQiIGZpbGw9IiMxODc3RjIiLz4KPGNpcmNsZSBjeD0iNTAiIGN5PSI1NSIgcj0iNCIgZmlsbD0iI0U0NDA1RiIvPgo8Y2lyY2xlIGN4PSI2NSIgY3k9IjU1IiByPSI0IiBmaWxsPSIjMDA3N0I1Ii8+Cjwvc3ZnPgo=",
      "timer": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiBmaWxsPSJsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjNjY3ZWVhIDAlLCAjNzY0YmEyIDEwMCUpIi8+Cjx0ZXh0IHg9IjUwIiB5PSIyNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4Ij5MSU1JVEVEIFRJTUUhPC90ZXh0Pgo8dGV4dCB4PSI1MCIgeT0iNDUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPjAwOjA1OjAwPC90ZXh0Pgo8cmVjdCB4PSIyNSIgeT0iNTUiIHdpZHRoPSI1MCIgaGVpZ2h0PSIxMCIgcng9IjUiIGZpbGw9IiNGRjZCNkIiLz4KPHN2Zz4K",
      "scratch-card": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgMTAwIDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjVGNUY1Ii8+CjxyZWN0IHg9IjIwIiB5PSIyMCIgd2lkdGg9IjM1IiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iIzRBOTBFMiIvPgo8dGV4dCB4PSIzNy41IiB5PSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI2Ij5TQ1JBVENIPC90ZXh0Pgo8dGV4dCB4PSIzNy41IiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI2Ij5IRVJFPC90ZXh0Pgo8dGV4dCB4PSIzNy41IiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4Ij7inIvvuI88L3RleHQ+Cjx0ZXh0IHg9IjcwIiB5PSI0NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzM3NDE1MSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiPlNjcmF0Y2ggJiBXaW4hPC90ZXh0Pgo8L3N2Zz4K"
    };
    return thumbnails[popup.type] || thumbnails["email"];
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

        {/* Promotional Banner */}
        <Banner
          title="🎯 Ecomsend Back in Stock Alert"
          status="info"
          onDismiss={() => {}}
        >
          <Text variant="bodyMd">
            Win back out-of-stock lost sales with smarter auto email or SMS notifications when restocking.
          </Text>
          <Box paddingBlockStart="200">
            <Button size="slim">Start for free</Button>
          </Box>
        </Banner>

        {/* Popup Library */}
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Popup library
          </Text>
          
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
                    <Box padding="400">
                      <InlineStack gap="400" align="space-between">
                        {/* Left side: Thumbnail + Details */}
                        <InlineStack gap="400" align="center">
                          <Box minWidth="80px">
                            <Thumbnail
                              source={getPopupThumbnail(popup)}
                              alt={popup.name}
                              size="large"
                            />
                          </Box>
                          
                          <BlockStack gap="100">
                            <Text as="h3" variant="headingSm" fontWeight="semibold">
                              {popup.name}
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                              Created: {formatDate(popup.createdAt)}
                            </Text>
                            <Text variant="bodySm" tone="subdued">
                              Last saved: {formatDate(popup.updatedAt || popup.createdAt)}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                        
                        {/* Center: Stats */}
                        <InlineStack gap="800" align="center">
                          <BlockStack gap="050" inlineAlign="center">
                            <Text variant="bodySm" tone="subdued">Popup views</Text>
                            <Text variant="bodyMd" fontWeight="semibold">-</Text>
                          </BlockStack>
                          <BlockStack gap="050" inlineAlign="center">
                            <Text variant="bodySm" tone="subdued">Subscribers</Text>
                            <Text variant="bodyMd" fontWeight="semibold">-</Text>
                          </BlockStack>
                          <BlockStack gap="050" inlineAlign="center">
                            <Text variant="bodySm" tone="subdued">Conversion rate</Text>
                            <Text variant="bodyMd" fontWeight="semibold">0%</Text>
                          </BlockStack>
                        </InlineStack>
                        
                        {/* Right side: Toggle + Actions */}
                        <InlineStack gap="300" align="center">
                          {/* Toggle Switch */}
                          <input
                            type="checkbox"
                            checked={popup.isActive}
                            onChange={() => handleToggleActive(popup)}
                            style={{
                              width: '44px',
                              height: '24px',
                              appearance: 'none',
                              backgroundColor: popup.isActive ? '#008060' : '#E1E3E5',
                              borderRadius: '12px',
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                            }}
                          />
                          
                          {/* Action Buttons */}
                          <InlineStack gap="200">
                            <Button
                              onClick={() => handleEditPopup(popup)}
                              variant="primary"
                              size="slim"
                            >
                              Customize
                            </Button>
                            <Popover
                              active={activePopover === popup.id}
                              activator={
                                <Button
                                  variant="plain"
                                  size="slim"
                                  onClick={() => setActivePopover(activePopover === popup.id ? null : popup.id)}
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
                                    }
                                  },
                                  {
                                    content: 'Delete',
                                    destructive: true,
                                    onAction: () => {
                                      handleDeletePopup(popup.id);
                                      setActivePopover(null);
                                    }
                                  }
                                ]}
                              />
                            </Popover>
                          </InlineStack>
                        </InlineStack>
                      </InlineStack>
                    </Box>
                    
                    {/* Divider between items (except last) */}
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
        <Box paddingBlockStart="800">
          <InlineStack align="center" gap="100">
            <Text variant="bodySm" tone="subdued">
              Learn more about
            </Text>
            <Button variant="plain" size="slim">
              Channelwill
            </Button>
          </InlineStack>
        </Box>
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
            onChange={setEditingName}
            placeholder="Enter popup name"
            autoComplete="off"
          />
        </Modal.Section>
      </Modal>
    </Page>
  );
}