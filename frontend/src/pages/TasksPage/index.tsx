import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  Trash2,
  Edit2,
  Zap,
  User,
  X
} from 'lucide-react';
import { apiStatusConstants, ApiStatus } from '../../constants/apiStatus';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import LoadingView from '../../components/LoadingView';
import FailureView from '../../components/FailureView';
import TaskModal from '../../components/TaskModal';
import CommentSection from '../../components/CommentSection';
import { Task, Project, User as UserType, Pagination, PerformanceMetrics } from '../../types';

const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<ApiStatus>(apiStatusConstants.initial);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  
  // Filter & Pagination State
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectIdFilter, setProjectIdFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Response Metadata
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);

  // Modals & Drawers
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeCommentTaskId, setActiveCommentTaskId] = useState<number | null>(null);

  const fetchTasks = async () => {
    setApiStatus(apiStatusConstants.inProgress);
    try {
      let queryParams = `page=${page}&limit=${limit}`;
      if (statusFilter) queryParams += `&status=${encodeURIComponent(statusFilter)}`;
      if (priorityFilter) queryParams += `&priority=${encodeURIComponent(priorityFilter)}`;
      if (projectIdFilter) queryParams += `&projectId=${projectIdFilter}`;
      if (searchQuery) queryParams += `&search=${encodeURIComponent(searchQuery)}`;

      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        apiFetch(`/tasks?${queryParams}`),
        apiFetch('/projects'),
        apiFetch('/auth/users')
      ]);

      setTasks(tasksRes.data.tasks || []);
      if (tasksRes.data.pagination) setPagination(tasksRes.data.pagination);
      if (tasksRes.data.performance) setPerformance(tasksRes.data.performance);

      setProjects(projectsRes.data.projects || []);
      setUsers(usersRes.data.users || []);
      setApiStatus(apiStatusConstants.success);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load tasks list');
      setApiStatus(apiStatusConstants.failure);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [page, limit, statusFilter, priorityFilter, projectIdFilter, searchQuery]);

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (selectedTask) {
      await apiFetch(`/tasks/${selectedTask.id}`, {
        method: 'PATCH',
        body: JSON.stringify(taskData)
      });
    } else {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
    }
    fetchTasks();
  };

  const handleQuickStatusUpdate = async (taskId: number, newStatus: string) => {
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      // Optimistic update local state
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const isManagerOrAdmin = user?.role === 'Admin' || user?.role === 'Manager';

  const renderBoardView = () => {
    const columns = [
      { id: 'To Do', label: 'To Do', color: 'indigo' },
      { id: 'In Progress', label: 'In Progress', color: 'amber' },
      { id: 'In Review', label: 'In Review', color: 'rose' },
      { id: 'Completed', label: 'Completed', color: 'emerald' }
    ];

    return (
      <div className="kanban-board-grid">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div key={col.id} className="kanban-column glass-card">
              <div className={`column-header header-${col.color}`}>
                <div className="column-title-wrap">
                  <span className="column-dot"></span>
                  <h4>{col.label}</h4>
                </div>
                <span className="task-count-badge">{colTasks.length}</span>
              </div>

              <div className="column-cards-container">
                {colTasks.length === 0 ? (
                  <div className="empty-column-drop">No tasks in {col.label}</div>
                ) : (
                  colTasks.map((task) => (
                    <div key={task.id} className="task-card glass-card hover-lift">
                      <div className="task-card-top">
                        <span className={`pill-badge priority-${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                        <div className="card-actions">
                          {isManagerOrAdmin && (
                            <button
                              type="button"
                              className="icon-action-btn"
                              onClick={() => {
                                setSelectedTask(task);
                                setIsTaskModalOpen(true);
                              }}
                              title="Edit Task"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {isManagerOrAdmin && (
                            <button
                              type="button"
                              className="icon-action-btn danger"
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              title="Delete Task"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="task-card-title">{task.title}</h4>
                      {task.description && <p className="task-card-desc">{task.description}</p>}

                      <div className="task-card-project">
                        <span className="project-tag-name">{task.project_name || 'General Project'}</span>
                      </div>

                      <div className="task-card-footer">
                        <div className="assignee-box" title={task.assignee_name || 'Unassigned'}>
                          <img
                            src={
                              task.assignee_avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                task.assignee_name || 'U'
                              )}&background=4f46e5&color=fff`
                            }
                            alt={task.assignee_name || 'User'}
                            className="mini-avatar"
                          />
                          <span className="assignee-name-text">{task.assignee_name || 'Unassigned'}</span>
                        </div>

                        <button
                          type="button"
                          className="comments-count-btn"
                          onClick={() => setActiveCommentTaskId(task.id)}
                          title="Open discussions"
                        >
                          <MessageSquare size={14} />
                          <span>{task.comment_count || 0}</span>
                        </button>
                      </div>

                      {/* Quick Move Dropdown */}
                      <div className="quick-move-row">
                        <span className="move-label">Move to:</span>
                        <select
                          className="mini-status-select"
                          value={task.status}
                          onChange={(e) => handleQuickStatusUpdate(task.id, e.target.value)}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="In Review">In Review</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="list-table-wrapper glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Project</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assignee</th>
              <th>Due Date</th>
              <th>Discussions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-muted">
                  No tasks match current filter parameters.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover-row">
                  <td className="font-semibold text-main">
                    <div>{task.title}</div>
                    {task.description && <div className="text-muted-sm">{task.description.slice(0, 60)}...</div>}
                  </td>
                  <td>
                    <span className="project-tag-name">{task.project_name || 'General Project'}</span>
                  </td>
                  <td>
                    <select
                      className={`mini-status-select status-${task.status.toLowerCase().replace(/\s+/g, '-')}`}
                      value={task.status}
                      onChange={(e) => handleQuickStatusUpdate(task.id, e.target.value)}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td>
                    <span className={`pill-badge priority-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <div className="assignee-box">
                      <User size={14} />
                      <span>{task.assignee_name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td>{task.due_date || 'N/A'}</td>
                  <td>
                    <button
                      type="button"
                      className="comments-count-btn"
                      onClick={() => setActiveCommentTaskId(task.id)}
                    >
                      <MessageSquare size={14} />
                      <span>{task.comment_count || 0}</span>
                    </button>
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      {isManagerOrAdmin && (
                        <button
                          type="button"
                          className="icon-action-btn"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsTaskModalOpen(true);
                          }}
                        >
                          <Edit2 size={15} />
                        </button>
                      )}
                      {isManagerOrAdmin && (
                        <button
                          type="button"
                          className="icon-action-btn danger"
                          onClick={(e) => handleDeleteTask(task.id, e)}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSuccessView = () => {
    return (
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Task Management Platform</h1>
            <p className="page-subtitle">Server-side paginated task views with foreign key indexed search filters.</p>
          </div>
          <div className="header-actions">
            <div className="view-toggle-group">
              <button
                type="button"
                className={`toggle-btn ${viewMode === 'board' ? 'active' : ''}`}
                onClick={() => setViewMode('board')}
              >
                <Kanban size={16} />
                <span>Board View</span>
              </button>
              <button
                type="button"
                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
                <span>List View</span>
              </button>
            </div>

            {isManagerOrAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedTask(null);
                  setIsTaskModalOpen(true);
                }}
              >
                <Plus size={18} />
                <span>Create Task</span>
              </button>
            )}
          </div>
        </div>

        {/* Query Latency Benchmark Highlight */}
        {performance && (
          <div className="benchmark-banner glass-card">
            <Zap size={16} className="text-amber-400 fill-amber-400" />
            <span>
              Indexed PostgreSQL Query Executed in <strong>{performance.executionTimeMs} ms</strong> — List query time cut by <strong>{performance.optimizedSpeedup}</strong> on seeded dataset.
            </span>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="filter-bar glass-card">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks by title or criteria..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-controls">
            <div className="select-wrap">
              <Filter size={16} className="select-icon" />
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="select-wrap">
              <select
                className="filter-select"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="select-wrap">
              <select
                className="filter-select"
                value={projectIdFilter}
                onChange={(e) => {
                  setProjectIdFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Render View */}
        {viewMode === 'board' ? renderBoardView() : renderListView()}

        {/* Server-Side Pagination Bar */}
        <div className="pagination-bar glass-card">
          <div className="pagination-info">
            Showing <strong>{tasks.length}</strong> of <strong>{pagination.total}</strong> total tasks (Page {pagination.page} of {pagination.totalPages})
          </div>

          <div className="pagination-controls">
            <div className="items-per-page">
              <label htmlFor="limitSelect">Per Page:</label>
              <select
                id="limitSelect"
                className="limit-select"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <button
              type="button"
              className="page-btn"
              disabled={!pagination.hasPrev}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <span className="page-number-display">{pagination.page}</span>

            <button
              type="button"
              className="page-btn"
              disabled={!pagination.hasNext}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Modals & Comments */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveTask}
          initialTask={selectedTask}
          projects={projects}
          users={users}
        />

        {activeCommentTaskId && (
          <div className="modal-overlay" onClick={() => setActiveCommentTaskId(null)}>
            <div className="modal-content glass-card comments-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Task Discussion & Activity Feed</h3>
                <button type="button" className="close-btn" onClick={() => setActiveCommentTaskId(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <CommentSection taskId={activeCommentTaskId} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (apiStatus) {
      case apiStatusConstants.inProgress:
        return <LoadingView message="Fetching task list & server-side pagination..." />;
      case apiStatusConstants.failure:
        return <FailureView message={errorMessage} onRetry={fetchTasks} />;
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

export default TasksPage;
