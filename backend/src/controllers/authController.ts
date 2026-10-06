import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../services/dbService';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role = 'Member', avatar_url } = req.body;

    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ status: 'error', message: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, role, avatar_url) VALUES (?, ?, ?, ?, ?)',
      [name, email.toLowerCase(), hashedPassword, role, avatar_url || null]
    );

    const insertedId = result.rows[0]?.id;
    const fetchedUserRes = insertedId
      ? await query('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?', [insertedId])
      : await query('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE email = ?', [email.toLowerCase()]);

    const newUser = fetchedUserRes.rows[0];

    const payload = { userId: newUser.id, email: newUser.email, role: newUser.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [
      newUser.id,
      refreshToken,
      expiresAt
    ]);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: newUser,
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const userRes = await query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [
      user.id,
      refreshToken,
      expiresAt
    ]);

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ status: 'error', message: 'Refresh token is required.' });
    }

    const tokenRes = await query('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken]);
    if (tokenRes.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Invalid refresh token.' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      await query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
      return res.status(401).json({ status: 'error', message: 'Expired refresh token.' });
    }

    const userRes = await query('SELECT id, name, email, role, avatar_url FROM users WHERE id = ?', [payload.userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    const user = userRes.rows[0];
    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

    // Rotate refresh token
    await query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await query('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [
      user.id,
      newRefreshToken,
      expiresAt
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user
      }
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Unauthenticated' });
    }
    const userRes = await query('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?', [req.user.userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.status(200).json({ status: 'success', data: { user: userRes.rows[0] } });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const usersRes = await query('SELECT id, name, email, role, avatar_url, created_at FROM users ORDER BY name ASC');
    res.status(200).json({ status: 'success', data: { users: usersRes.rows } });
  } catch (err) {
    next(err);
  }
};
