import React from 'react';

interface LoadingViewProps {
  fullScreen?: boolean;
  message?: string;
}

const LoadingView: React.FC<LoadingViewProps> = ({ fullScreen = false, message = 'Loading content...' }) => {
  return (
    <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="spinner-wrapper">
        <div className="spinner-ring"></div>
        <div className="spinner-core"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingView;
