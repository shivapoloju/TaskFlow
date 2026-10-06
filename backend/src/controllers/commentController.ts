import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { query } from '../services/dbService';

export const getCommentsByTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId;
    const commentsRes = await query(`
      SELECT c.id, c.task_id, c.user_id, c.content, c.created_at,
             u.name as user_name, u.email as user_email, u.role as user_role, u.avatar_url as user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `, [taskId]);

    res.status(200).json({ status: 'success', data: { comments: commentsRes.rows } });
  } catch (err) {
    next(err);
  }
};

export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.taskId;
    const { content } = req.body;
    const userId = req.user!.userId;

    const taskCheck = await query('SELECT id FROM tasks WHERE id = ?', [taskId]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Task not found' });
    }

    const result = await query(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [taskId, userId, content]
    );

    const insertedId = result.rows[0]?.id;
    const fetchedRes = insertedId
      ? await query('SELECT id, task_id, user_id, content, created_at FROM comments WHERE id = ?', [insertedId])
      : await query('SELECT id, task_id, user_id, content, created_at FROM comments WHERE task_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1', [taskId, userId]);

    const newComment = fetchedRes.rows[0];

    const userRes = await query('SELECT name, email, role, avatar_url FROM users WHERE id = ?', [userId]);
    const commentWithUser = {
      ...newComment,
      user_name: userRes.rows[0]?.name,
      user_email: userRes.rows[0]?.email,
      user_role: userRes.rows[0]?.role,
      user_avatar: userRes.rows[0]?.avatar_url
    };

    res.status(201).json({ status: 'success', data: { comment: commentWithUser } });
  } catch (err) {
    next(err);
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const commentRes = await query('SELECT user_id FROM comments WHERE id = ?', [id]);
    if (commentRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Comment not found' });
    }

    if (commentRes.rows[0].user_id !== userId && role !== 'Admin' && role !== 'Manager') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized to delete this comment' });
    }

    await query('DELETE FROM comments WHERE id = ?', [id]);
    res.status(200).json({ status: 'success', message: 'Comment deleted successfully' });
  } catch (err) {
    next(err);
  }
};
