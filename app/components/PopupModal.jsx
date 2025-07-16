import { useState } from "react";
import PopupCreationModal from "./PopupCreationModal";

export default function PopupModal({ existingConfig }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    // Reload the page to refresh setup progress
    window.location.reload();
  };

  return (
    <>
      {/* Configure Popup Button */}
      <button
        onClick={openModal}
        style={{
          backgroundColor: "#008060",
          color: "white",
          border: "none",
          borderRadius: "6px",
          padding: "12px 24px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "background-color 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = "#006b4f";
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = "#008060";
        }}
      >
        Configure Popup
      </button>

      {/* Use the existing PopupCreationModal with Polaris Modal */}
      <PopupCreationModal
        active={isModalOpen}
        onClose={closeModal}
        existingConfig={existingConfig}
      />
    </>
  );
}