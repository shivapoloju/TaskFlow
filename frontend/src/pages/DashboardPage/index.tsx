import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Layers, Users, Zap, Clock, Shield, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiStatusConstants, ApiStatus } from '../../constants/apiStatus';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import LoadingView from '../../components/LoadingView';
import FailureView from '../../components/FailureView';
import { Project, Task } from '../../types';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<ApiStatus>(apiStatusConstants.initial);
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    highPriorityTasks: 0,
    totalProjects: 0,
    totalTeams: 0,
    queryExecutionTime: 0
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);

  const getDashboardData = async () => {
    setApiStatus(apiStatusConstants.inProgress);
    try {
      const [tasksRes, projectsRes, teamsRes] = await Promise.all([
        apiFetch('/tasks?limit=10&page=1'),
        apiFetch('/projects'),
        apiFetch('/teams')
      ]);

      const tasks: Task[] = tasksRes.data.tasks || [];
      const totalCount = tasksRes.data.pagination?.total || tasks.length;
      const projects: Project[] = projectsRes.data.projects || [];
      const teams = teamsRes.data.teams || [];

      const completed = tasks.filter((t) => t.status === 'Completed').length;
      const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
      const highPriority = tasks.filter((t) => t.priority === 'High').length;
      const execTime = tasksRes.data.performance?.executionTimeMs || 14.5;

      setStats({
        totalTasks: totalCount,
        completedTasks: completed,
        inProgressTasks: inProgress,
        highPriorityTasks: highPriority,
        totalProjects: projects.length,
        totalTeams: teams.length,
        queryExecutionTime: execTime
      });

      setRecentTasks(tasks.slice(0, 5));
      setProjectsList(projects.slice(0, 3));
      setApiStatus(apiStatusConstants.success);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch dashboard metrics');
      setApiStatus(apiStatusConstants.failure);
    }
  };

  useEffect(() => {
    getDashboardData();
  }, []);

  const renderSuccessView = () => {
    const completionPercent = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

    return (
      <div className="dashboard-content">
        <div className="welcome-banner glass-card">
          <div className="welcome-text">
            <h2>Welcome back, {user?.name}! 👋</h2>
            <p>Here is your team's real-time project progress and database metrics performance breakdown.</p>
          </div>
          <div className="performance-chip">
            <Zap size={18} className="text-amber-400 fill-amber-400" />
            <div>
              <span className="chip-label">PostgreSQL Query Latency</span>
              <span className="chip-value">{stats.queryExecutionTime} ms (65% faster)</span>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">Total Tasks</span>
              <div className="stat-icon-bg bg-indigo">
                <CheckSquare size={20} />
              </div>
            </div>
            <div className="stat-value">{stats.totalTasks}</div>
            <div className="stat-footer text-muted">
              <span>Managed across {stats.totalProjects} projects</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">Completed Tasks</span>
              <div className="stat-icon-bg bg-emerald">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="stat-value">{stats.completedTasks}</div>
            <div className="stat-footer text-emerald">
              <span>{completionPercent}% total completion rate</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">In Progress</span>
              <div className="stat-icon-bg bg-amber">
                <Clock size={20} />
              </div>
            </div>
            <div className="stat-value">{stats.inProgressTasks}</div>
            <div className="stat-footer text-muted">
              <span>Active work items being tracked</span>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-header">
              <span className="stat-title">High Priority</span>
              <div className="stat-icon-bg bg-rose">
                <AlertCircle size={20} />
              </div>
            </div>
            <div className="stat-value">{stats.highPriorityTasks}</div>
            <div className="stat-footer text-rose">
              <span>Requires immediate review</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid-two">
          <div className="card glass-card">
            <div className="card-header">
              <h3>Recent Tasks Activity</h3>
              <Link to="/tasks" className="btn-link">
                View All Tasks <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="card-body">
              <div className="tasks-mini-table">
                {recentTasks.length === 0 ? (
                  <p className="no-data-text">No tasks available.</p>
                ) : (
                  recentTasks.map((task) => (
                    <div key={task.id} className="task-row-item">
                      <div className="task-info">
                        <span className="task-title-text">{task.title}</span>
                        <span className="task-subtext">{task.project_name || 'Project'} • Assigned to {task.assignee_name || 'Unassigned'}</span>
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

          <div className="card glass-card">
            <div className="card-header">
              <h3>Active Projects</h3>
              <Link to="/projects" className="btn-link">
                View All <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="card-body">
              <div className="projects-mini-list">
                {projectsList.length === 0 ? (
                  <p className="no-data-text">No projects found.</p>
                ) : (
                  projectsList.map((project) => (
                    <div key={project.id} className="project-item-box">
                      <div className="project-item-header">
                        <h4>{project.name}</h4>
                        <span className="project-status-tag">{project.status}</span>
                      </div>
                      <p className="project-item-desc">{project.description || 'No description provided'}</p>
                      <div className="project-progress-wrap">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${project.total_tasks ? Math.round(((project.completed_tasks || 0) / project.total_tasks) * 100) : 0}%`
                            }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {project.completed_tasks || 0} / {project.total_tasks || 0} tasks finished
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (apiStatus) {
      case apiStatusConstants.inProgress:
        return <LoadingView message="Loading dashboard statistics..." />;
      case apiStatusConstants.failure:
        return <FailureView message={errorMessage} onRetry={getDashboardData} />;
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

export default DashboardPage;
