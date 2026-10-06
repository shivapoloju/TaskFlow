import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { query } from '../services/dbService';

export const getProjects = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { teamId, status, search } = req.query;
    let sql = `
      SELECT p.id, p.name, p.description, p.team_id, p.status, p.created_at,
             t.name as team_name, u.name as creator_name,
             (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.id) as total_tasks,
             (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.id AND tk.status = 'Completed') as completed_tasks
      FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (teamId) {
      sql += ' AND p.team_id = ?';
      params.push(teamId);
    }

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY p.created_at DESC';

    const projectsRes = await query(sql, params);
    res.status(200).json({ status: 'success', data: { projects: projectsRes.rows } });
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, teamId, status = 'Planning' } = req.body;
    const userId = req.user!.userId;

    const result = await query(
      'INSERT INTO projects (name, description, team_id, status, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, teamId, status, userId]
    );

    const insertedId = result.rows[0]?.id;
    const fetchedRes = insertedId
      ? await query('SELECT id, name, description, team_id, status, created_at FROM projects WHERE id = ?', [insertedId])
      : await query('SELECT id, name, description, team_id, status, created_at FROM projects WHERE name = ? ORDER BY id DESC LIMIT 1', [name]);

    const newProject = fetchedRes.rows[0];

    res.status(201).json({ status: 'success', data: { project: newProject } });
  } catch (err) {
    next(err);
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const projectRes = await query(`
      SELECT p.id, p.name, p.description, p.team_id, p.status, p.created_at,
             t.name as team_name, u.name as creator_name
      FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [projectId]);

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Project not found' });
    }

    const statsRes = await query(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'To Do' THEN 1 ELSE 0 END) as todo_count,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'In Review' THEN 1 ELSE 0 END) as in_review_count,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(estimated_hours) as total_estimated_hours
      FROM tasks
      WHERE project_id = ?
    `, [projectId]);

    res.status(200).json({
      status: 'success',
      data: {
        project: projectRes.rows[0],
        statistics: statsRes.rows[0]
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    const { name, description, teamId, status } = req.body;

    const fields: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (teamId !== undefined) { fields.push('team_id = ?'); params.push(teamId); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No fields provided for update' });
    }

    params.push(projectId);
    await query(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, params);

    const updatedRes = await query('SELECT * FROM projects WHERE id = ?', [projectId]);
    res.status(200).json({ status: 'success', data: { project: updatedRes.rows[0] } });
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    await query('DELETE FROM projects WHERE id = ?', [projectId]);
    res.status(200).json({ status: 'success', message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};
