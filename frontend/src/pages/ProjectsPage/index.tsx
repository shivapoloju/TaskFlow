import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Search, Filter, FolderKanban, Users, Trash2, ArrowUpRight, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { apiStatusConstants, ApiStatus } from '../../constants/apiStatus';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import LoadingView from '../../components/LoadingView';
import FailureView from '../../components/FailureView';
import ProjectModal from '../../components/ProjectModal';
import { Project, Team } from '../../types';

const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState<ApiStatus>(apiStatusConstants.initial);
  const [errorMessage, setErrorMessage] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchProjects = async () => {
    setApiStatus(apiStatusConstants.inProgress);
    try {
      let url = '/projects?';
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const [projRes, teamsRes] = await Promise.all([
        apiFetch(url),
        apiFetch('/teams')
      ]);

      setProjects(projRes.data.projects || []);
      setTeams(teamsRes.data.teams || []);
      setApiStatus(apiStatusConstants.success);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch projects list');
      setApiStatus(apiStatusConstants.failure);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, searchQuery]);

  const handleCreateProject = async (projectData: Partial<Project>) => {
    await apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
    fetchProjects();
  };

  const handleDeleteProject = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await apiFetch(`/projects/${projectId}`, { method: 'DELETE' });
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  // Metrics summary calculations
  const totalProjectsCount = projects.length;
  const inProgressCount = projects.filter(p => p.status === 'In Progress').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;
  const planningCount = projects.filter(p => p.status === 'Planning').length;

  const renderSuccessView = () => {
    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects Directory & Active Projects</h1>
            <p className="page-subtitle">Track project deliverables, team allocations, and milestone completion metrics.</p>
          </div>
          {isManagerOrAdmin && (
            <button type="button" className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              <span>Create Project</span>
            </button>
          )}
        </div>

        {/* Hero Summary Cards */}
        <div className="hero-summary-bar">
          <div className="summary-card glass-card">
            <div className="summary-icon-box bg-indigo">
              <Layers size={22} />
            </div>
            <div className="summary-info">
              <span className="summary-value">{totalProjectsCount}</span>
              <span className="summary-label">Total Projects</span>
            </div>
          </div>

          <div className="summary-card glass-card">
            <div className="summary-icon-box bg-amber">
              <Clock size={22} />
            </div>
            <div className="summary-info">
              <span className="summary-value">{inProgressCount}</span>
              <span className="summary-label">Active / In Progress</span>
            </div>
          </div>

          <div className="summary-card glass-card">
            <div className="summary-icon-box bg-emerald">
              <CheckCircle2 size={22} />
            </div>
            <div className="summary-info">
              <span className="summary-value">{completedCount}</span>
              <span className="summary-label">Completed</span>
            </div>
          </div>

          <div className="summary-card glass-card">
            <div className="summary-icon-box bg-rose">
              <PlayCircle size={22} />
            </div>
            <div className="summary-info">
              <span className="summary-value">{planningCount}</span>
              <span className="summary-label">Planning Stage</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="filter-bar glass-card">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search projects directory by name or scope..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <div className="select-wrap">
              <Filter size={16} className="select-icon" />
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Cards Grid */}
        {projects.length === 0 ? (
          <div className="empty-state glass-card">
            <FolderKanban size={48} className="empty-icon text-muted" />
            <h3>No Projects Found</h3>
            <p>Try adjusting your search query or status filter parameters.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => {
              const total = project.total_tasks || 0;
              const completed = project.completed_tasks || 0;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div
                  key={project.id}
                  className="project-card glass-card hover-lift"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="project-card-header">
                    <span className={`pill-badge status-${project.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {project.status}
                    </span>
                    {user?.role === 'Admin' && (
                      <button
                        type="button"
                        className="icon-action-btn danger"
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        title="Delete project"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <h3 className="project-title">{project.name}</h3>
                  <p className="project-desc">{project.description || 'No description provided.'}</p>

                  <div className="project-meta-info">
                    <div className="meta-item">
                      <Users size={14} className="text-indigo-400" />
                      <span>{project.team_name || 'Engineering Squad'}</span>
                    </div>
                    <div className="meta-item">
                      <ArrowUpRight size={14} className="text-indigo-400" />
                      <span>View Details</span>
                    </div>
                  </div>

                  <div className="project-progress">
                    <div className="progress-labels">
                      <span>Tasks Completion Progress</span>
                      <span className="font-bold text-indigo-400">{percent}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="progress-footer">
                      <span>{completed} of {total} tasks finished</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ProjectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleCreateProject}
          teams={teams}
        />
      </div>
    );
  };

  const renderContent = () => {
    switch (apiStatus) {
      case apiStatusConstants.inProgress:
        return <LoadingView message="Loading active projects directory..." />;
      case apiStatusConstants.failure:
        return <FailureView message={errorMessage} onRetry={fetchProjects} />;
      case apiStatusConstants.success:
        return renderSuccessView();
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="main-content">{renderContent()}</main>
      </div>
    </div>
  );
};

export default ProjectsPage;
