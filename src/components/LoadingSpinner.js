import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = "Loading...", size = "medium" }) => {
  return (
    <div className={`loading-container ${size}`}>
      <div className="spinner"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner; 