// CustomModal.js
import React from "react";
import Modal from "react-modal";

const CustomModal = ({ isOpen, closeModal, title, content }) => {
  return (
    <div>
      <Modal
        isOpen={isOpen}
        onRequestClose={closeModal}
        ariaHideApp={false}
        style={{
          content: {
            top: "50%", // Adjust the top position
            left: "50%", // Adjust the left position
            transform: "translate(-50%, -50%)", // Center the modal
            padding: "5px", // Remove padding
            borderRadius: "0px",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.3)", // Adjust the overlay color if needed
          },
        }}
      >
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content" style={{ border: "none" }}>
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <a
                type="button"
                className="close"
                onClick={closeModal}
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </a>
            </div>
            <div
              className="modal-body"
              style={{ wordWrap: "break-word", hyphens: "auto" }}
            >
              {content}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomModal;
