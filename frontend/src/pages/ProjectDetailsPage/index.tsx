import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Layers, CheckSquare, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiStatusConstants, ApiStatus } from '../../constants/apiStatus';
import { apiFetch } from '../../services/api';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import LoadingView from '../../components/LoadingView';
import FailureView from '../../components/FailureView';
import { Project, Task } from '../../types';

const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [apiStatus, setApiStatus] = useState<ApiStatus>(apiStatusConstants.initial);
  const [errorMessage, setErrorMessage] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<any>({});
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchProjectDetails = async () => {
    setApiStatus(apiStatusConstants.inProgress);
    try {
      const [projRes, tasksRes] = await Promise.all([
        apiFetch(`/projects/${id}`),
        apiFetch(`/tasks?projectId=${id}&limit=50`)
      ]);

      setProject(projRes.data.project);
      setStats(projRes.data.statistics || {});
      setTasks(tasksRes.data.tasks || []);
      setApiStatus(apiStatusConstants.success);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch project details');
      setApiStatus(apiStatusConstants.failure);
    }
  };

  useEffect(() => {
    if (id) fetchProjectDetails();
  }, [id]);

  const renderSuccessView = () => {
    if (!project) return null;

    return (
      <div className="page-content">
        <div className="breadcrumb">
          <Link to="/projects" className="btn-link">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
        </div>

        <div className="project-detail-header glass-card">
          <div className="detail-header-top">
            <div className="title-group">
              <div className="icon-badge">
                <Layers size={24} className="text-indigo-400" />
              </div>
              <div>
                <h1>{project.name}</h1>
                <p className="team-subtext">Assigned Team: {project.team_name || 'Engineering Squad'}</p>
              </div>
            </div>
            <span className={`pill-badge status-${project.status.toLowerCase().replace(/\s+/g, '-')}`}>
              {project.status}
            </span>
          </div>
          <p className="detail-desc">{project.description || 'No detailed description provided.'}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">To Do</span>
              <div className="stat-icon-bg bg-indigo"><CheckSquare size={18} /></div>
            </div>
            <div className="stat-value">{stats.todo_count || 0}</div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">In Progress</span>
              <div className="stat-icon-bg bg-amber"><Clock size={18} /></div>
            </div>
            <div className="stat-value">{stats.in_progress_count || 0}</div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">In Review</span>
              <div className="stat-icon-bg bg-rose"><AlertCircle size={18} /></div>
            </div>
            <div className="stat-value">{stats.in_review_count || 0}</div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">Completed</span>
              <div className="stat-icon-bg bg-emerald"><CheckCircle2 size={18} /></div>
            </div>
            <div className="stat-value">{stats.completed_count || 0}</div>
          </div>
        </div>

        <div className="card glass-card margin-top-md">
          <div className="card-header">
            <h3>Project Tasks Breakdown ({tasks.length})</h3>
          </div>
          <div className="card-body">
            <div className="tasks-list">
              {tasks.length === 0 ? (
                <p className="no-data-text">No tasks associated with this project yet.</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="task-row-item border-bottom">
                    <div className="task-info">
                      <span className="task-title-text">{task.title}</span>
                      <span className="task-subtext">Assignee: {task.assignee_name || 'Unassigned'} • Due: {task.due_date || 'N/A'}</span>
                    </div>
                    <div className="task-badges">
                      <span className={`pill-badge status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {task.status}
                      </span>
                      <span className={`pill-badge priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (apiStatus) {
      case apiStatusConstants.inProgress:
        return <LoadingView message="Loading project statistics..." />;
      case apiStatusConstants.failure:
        return <FailureView message={errorMessage} onRetry={fetchProjectDetails} />;
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

export default ProjectDetailsPage;
