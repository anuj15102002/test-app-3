import { useState } from "react";
import { Button } from "@shopify/polaris";
import PopupTypeSelectionModal from "./PopupTypeSelectionModal";

export default function CreatePopupButton({ existingConfig, variant = "primary", size = "medium" }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    // Reload the page to refresh setup progress
    window.location.reload();
  };

  return (
    <>
      <Button
        onClick={openModal}
        variant={variant}
        size={size}
        accessibilityLabel="Create new popup"
      >
        + Create Popup
      </Button>

      <PopupTypeSelectionModal
        active={isModalOpen}
        onClose={closeModal}
        existingConfig={existingConfig}
      />
    </>
  );
}