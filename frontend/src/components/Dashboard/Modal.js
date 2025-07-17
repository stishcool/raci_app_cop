import React from 'react';
import './Modal.css';

const Modal = ({ children, onClose }) => {
  const handleBackgroundClick = (e) => {
    if (e.target.classList.contains('modal')) {
      console.log('Modal: Клик по фону');
      onClose();
    }
  };

  return (
    <div className="modal" onClick={handleBackgroundClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;