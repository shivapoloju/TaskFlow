import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FailureViewProps {
  message?: string;
  onRetry: () => void;
}

const FailureView: React.FC<FailureViewProps> = ({
  message = 'Something went wrong. Please try again.',
  onRetry
}) => {
  return (
    <div className="failure-container">
      <div className="failure-icon-badge">
        <AlertTriangle className="icon-warning" size={36} />
      </div>
      <h3 className="failure-title">Oops! Failed to load data</h3>
      <p className="failure-description">{message}</p>
      <button type="button" className="retry-btn" onClick={onRetry}>
        <RefreshCw size={16} className="spin-on-hover" />
        Retry
      </button>
    </div>
  );
};

export default FailureView;
