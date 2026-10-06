import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { query } from '../services/dbService';

export const getTeams = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const teamsRes = await query(`
      SELECT t.id, t.name, t.description, t.created_at, u.name as creator_name,
      (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count,
      (SELECT COUNT(*) FROM projects p WHERE p.team_id = t.id) as project_count
      FROM teams t
      LEFT JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `);
    res.status(200).json({ status: 'success', data: { teams: teamsRes.rows } });
  } catch (err) {
    next(err);
  }
};

export const createTeam = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.userId;

    const result = await query(
      'INSERT INTO teams (name, description, created_by) VALUES (?, ?, ?)',
      [name, description || null, userId]
    );

    const insertedId = result.rows[0]?.id;
    const fetchedTeam = insertedId
      ? await query('SELECT id, name, description, created_at FROM teams WHERE id = ?', [insertedId])
      : await query('SELECT id, name, description, created_at FROM teams WHERE name = ? ORDER BY id DESC LIMIT 1', [name]);

    const newTeam = fetchedTeam.rows[0];

    // Automatically add creator as Manager/Admin in team_members
    await query('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [
      newTeam.id,
      userId,
      req.user!.role === 'Admin' ? 'Admin' : 'Manager'
    ]);

    res.status(201).json({ status: 'success', data: { team: newTeam } });
  } catch (err) {
    next(err);
  }
};

export const getTeamById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.id;
    const teamRes = await query(`
      SELECT t.id, t.name, t.description, t.created_at, u.name as creator_name
      FROM teams t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `, [teamId]);

    if (teamRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Team not found' });
    }

    const membersRes = await query(`
      SELECT tm.id, tm.role, tm.joined_at, u.id as user_id, u.name, u.email, u.avatar_url
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY u.name ASC
    `, [teamId]);

    res.status(200).json({
      status: 'success',
      data: {
        team: teamRes.rows[0],
        members: membersRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
};

export const addTeamMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.id;
    const { userId, role = 'Member' } = req.body;

    const existingMember = await query('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
    if (existingMember.rows.length > 0) {
      return res.status(409).json({ status: 'error', message: 'User is already a member of this team' });
    }

    await query('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [teamId, userId, role]);
    res.status(201).json({ status: 'success', message: 'Team member added successfully' });
  } catch (err) {
    next(err);
  }
};

export const removeTeamMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id: teamId, userId } = req.params;
    await query('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
    res.status(200).json({ status: 'success', message: 'Team member removed successfully' });
  } catch (err) {
    next(err);
  }
};

export const deleteTeam = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const teamId = req.params.id;
    await query('DELETE FROM teams WHERE id = ?', [teamId]);
    res.status(200).json({ status: 'success', message: 'Team deleted successfully' });
  } catch (err) {
    next(err);
  }
};
