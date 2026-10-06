import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="auth-page-container">
      <div className="auth-card glass-card text-center">
        <div className="auth-logo-badge">
          <Layers size={36} className="text-indigo-400" />
        </div>
        <h1 className="error-404-title">404</h1>
        <h2 className="auth-title">Page Not Found</h2>
        <p className="auth-subtitle">The page or resource you requested does not exist or has been moved.</p>
        <div className="margin-top-md">
          <Link to="/dashboard" className="btn btn-primary inline-flex">
            <Home size={18} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
