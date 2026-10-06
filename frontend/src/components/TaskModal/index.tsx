import React, { useState, useEffect } from 'react';
import { X, CheckSquare } from 'lucide-react';
import { Task, Project, User } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<void>;
  initialTask?: Task | null;
  projects: Project[];
  users: User[];
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  projects,
  users
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'To Do' | 'In Progress' | 'In Review' | 'Completed'>('To Do');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [projectId, setProjectId] = useState<number | ''>('');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setStatus(initialTask.status);
      setPriority(initialTask.priority);
      setProjectId(initialTask.project_id);
      setAssigneeId(initialTask.assignee_id || '');
      setDueDate(initialTask.due_date || '');
      setEstimatedHours(initialTask.estimated_hours || 0);
    } else {
      setTitle('');
      setDescription('');
      setStatus('To Do');
      setPriority('Medium');
      setProjectId(projects.length > 0 ? projects[0].id : '');
      setAssigneeId(users.length > 0 ? users[0].id : '');
      setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
      setEstimatedHours(4);
    }
    setError('');
  }, [initialTask, isOpen, projects, users]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!projectId) {
      setError('Please select a project');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        title,
        description,
        status,
        priority,
        projectId: Number(projectId),
        assigneeId: assigneeId ? Number(assigneeId) : undefined,
        dueDate,
        estimatedHours: Number(estimatedHours)
      } as any);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <CheckSquare size={20} className="text-indigo-400" />
            <h3>{initialTask ? 'Edit Task' : 'Create New Task'}</h3>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="form-error-alert">{error}</div>}

          <div className="form-group">
            <label htmlFor="taskTitle">Task Title *</label>
            <input
              id="taskTitle"
              type="text"
              className="form-control"
              placeholder="e.g. Implement JWT Refresh Token rotation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="taskDesc">Description</label>
            <textarea
              id="taskDesc"
              className="form-control"
              rows={3}
              placeholder="Describe requirement breakdown, acceptance criteria, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="taskProject">Project *</label>
              <select
                id="taskProject"
                className="form-control"
                value={projectId}
                onChange={(e) => setProjectId(Number(e.target.value))}
                required
              >
                <option value="" disabled>Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="taskAssignee">Assignee</label>
              <select
                id="taskAssignee"
                className="form-control"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="taskStatus">Status</label>
              <select
                id="taskStatus"
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="form-group half">
              <label htmlFor="taskPriority">Priority</label>
              <select
                id="taskPriority"
                className="form-control"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="taskDueDate">Due Date</label>
              <input
                id="taskDueDate"
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="form-group half">
              <label htmlFor="taskEst">Est. Hours</label>
              <input
                id="taskEst"
                type="number"
                min="0"
                step="0.5"
                className="form-control"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
