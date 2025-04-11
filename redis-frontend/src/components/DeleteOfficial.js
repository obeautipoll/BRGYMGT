import React from 'react';
import './DeleteOfficial.css'; 

const DeleteOfficial = ({ officialId, onDeleteConfirm, onCancel }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onCancel}>&times;</span>
        <form onSubmit={(e) => { e.preventDefault(); onDeleteConfirm(officialId); }}>
          <h2>⚠ Confirm Deletion</h2>
          <p>Are you sure you want to delete the official with ID: <strong>{officialId}</strong>?</p>
          <div className="button-group">
            <button type="submit" className="confirm-btn">Yes, Delete</button>
            <button type="button" className=    "cancel-btn" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteOfficial;
