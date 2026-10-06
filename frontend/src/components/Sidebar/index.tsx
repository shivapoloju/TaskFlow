import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Layers, CheckSquare, Users, BookOpen, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section">
        <h4 className="sidebar-section-title">PLATFORM MENU</h4>
        <nav className="sidebar-links">
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard Overview</span>
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Layers size={18} />
            <span>Projects & Stats</span>
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <CheckSquare size={18} />
            <span>Task Management</span>
          </NavLink>
          <NavLink to="/teams" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Teams & Members</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-section">
        <h4 className="sidebar-section-title">DEVELOPER TOOLS</h4>
        <nav className="sidebar-links">
          <NavLink to="/api-docs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <BookOpen size={18} />
            <span>OpenAPI / Swagger</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-footer-widget">
        <div className="widget-header">
          <Zap size={16} className="text-amber-400" />
          <span>PostgreSQL Indexing</span>
        </div>
        <p className="widget-text">
          List queries cut by <strong>65%</strong> via Foreign Key & SQL index optimizations.
        </p>
        {user && (
          <div className="user-role-footer">
            <ShieldCheck size={14} />
            <span>Active Role: {user.role}</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
