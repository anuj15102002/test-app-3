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
  DataTable,
  ButtonGroup,
  Modal,
  TextField,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
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
      default: return type;
    }
  };

  const getPopupTypeBadge = (type) => {
    const colors = {
      "email": "info",
      "wheel-email": "success", 
      "community": "warning",
      "timer": "critical"
    };
    return colors[type] || "info";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tableRows = popups.map((popup) => [
    <Text variant="bodyMd" fontWeight="semibold">
      {popup.name}
    </Text>,
    <Badge tone={getPopupTypeBadge(popup.type)}>
      {getPopupTypeLabel(popup.type)}
    </Badge>,
    <Text variant="bodyMd" tone="subdued">
      {popup.title}
    </Text>,
    <Badge tone={popup.isActive ? "success" : "subdued"}>
      {popup.isActive ? "Active" : "Inactive"}
    </Badge>,
    <Text variant="bodyMd" tone="subdued">
      {formatDate(popup.createdAt)}
    </Text>,
    <ButtonGroup>
      <Button
        size="micro"
        onClick={() => handleToggleActive(popup)}
        tone={popup.isActive ? "critical" : "success"}
      >
        {popup.isActive ? "Deactivate" : "Activate"}
      </Button>
      <Button
        size="micro"
        onClick={() => handleEditPopup(popup)}
      >
        Edit
      </Button>
      <Button
        size="micro"
        tone="critical"
        onClick={() => handleDeletePopup(popup.id)}
      >
        Delete
      </Button>
    </ButtonGroup>
  ]);

  return (
    <Page>
      <TitleBar title="Popup Management" />
      
      <BlockStack gap="500">
        {/* Stats Banner */}
        <Layout>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Total Popups</Text>
                <Text as="p" variant="heading2xl">{popups.length}</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Active Popups</Text>
                <Text as="p" variant="heading2xl" tone="success">
                  {popups.filter(p => p.isActive).length}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">Inactive Popups</Text>
                <Text as="p" variant="heading2xl" tone="subdued">
                  {popups.filter(p => !p.isActive).length}
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Popups List */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Your Popups
                  </Text>
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    + Create Popup
                  </Button>
                </InlineStack>
                
                {popups.length === 0 ? (
                  <EmptyState
                    heading="Create your first popup"
                    action={{
                      content: "+ Create Popup",
                      onAction: () => setShowCreateModal(true)
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>
                      Start engaging your customers with beautiful popups.
                      Choose from email capture, spinning wheels, social media, and countdown timers.
                    </p>
                  </EmptyState>
                ) : (
                  <DataTable
                    columnContentTypes={[
                      'text',
                      'text', 
                      'text',
                      'text',
                      'text',
                      'text'
                    ]}
                    headings={[
                      'Name',
                      'Type', 
                      'Title',
                      'Status',
                      'Created',
                      'Actions'
                    ]}
                    rows={tableRows}
                  />
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Help Section */}
        <Layout>
          <Layout.Section>
            <Banner
              title="💡 Popup Management Tips"
              status="info"
            >
              <BlockStack gap="100">
                <Text variant="bodyMd">
                  • Only activate popups when you're ready to show them to customers
                </Text>
                <Text variant="bodyMd">
                  • Test your popups before activating them
                </Text>
                <Text variant="bodyMd">
                  • Monitor popup performance in the Analytics section
                </Text>
                <Text variant="bodyMd">
                  • You can have multiple popups but only activate the ones you need
                </Text>
              </BlockStack>
            </Banner>
          </Layout.Section>
        </Layout>
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