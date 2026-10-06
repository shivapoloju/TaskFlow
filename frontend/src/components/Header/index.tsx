import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Layers, LayoutDashboard, CheckSquare, Users, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="app-header">
      <div className="header-brand">
        <Link to="/dashboard" className="brand-link">
          <div className="logo-icon-bg">
            <Layers size={22} className="logo-svg" />
          </div>
          <span className="brand-name">TaskFlow</span>
        </Link>
        <span className="brand-version-badge">v2.0</span>
      </div>

      <nav className="header-nav">
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        <Link to="/projects" className={`nav-item ${isActive('/projects') ? 'active' : ''}`}>
          <Layers size={18} />
          <span>Projects</span>
        </Link>
        <Link to="/tasks" className={`nav-item ${isActive('/tasks') ? 'active' : ''}`}>
          <CheckSquare size={18} />
          <span>Tasks</span>
        </Link>
        <Link to="/teams" className={`nav-item ${isActive('/teams') ? 'active' : ''}`}>
          <Users size={18} />
          <span>Teams</span>
        </Link>
        <Link to="/api-docs" className={`nav-item ${isActive('/api-docs') ? 'active' : ''}`}>
          <BookOpen size={18} />
          <span>API Docs</span>
        </Link>
      </nav>

      <div className="header-user-actions">
        {user && (
          <div className="user-profile-card">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff`}
              alt={user.name}
              className="user-avatar"
            />
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className={`role-badge role-${user.role.toLowerCase()}`}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        <button type="button" onClick={handleLogout} className="logout-btn" title="Logout session">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
