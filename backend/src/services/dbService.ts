import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import { config } from '../config/database';
import fs from 'fs';
import path from 'path';

let sqliteDb: sqlite3.Database | null = null;
let pgPool: Pool | null = null;
const isPostgres = Boolean(config.databaseUrl);

if (isPostgres) {
  pgPool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  sqliteDb = new sqlite3.Database(config.dbPath);
  sqliteDb.run('PRAGMA foreign_keys = ON;');
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export const query = async <T = any>(
  sql: string,
  params: any[] = []
): Promise<QueryResult<T>> => {
  if (isPostgres && pgPool) {
    // Convert SQLite style ? to $1, $2, etc. if needed
    let pgSql = sql;
    let paramIndex = 1;
    while (pgSql.includes('?')) {
      pgSql = pgSql.replace('?', `$${paramIndex++}`);
    }
    const res = await pgPool.query(pgSql, params);
    return { rows: res.rows as T[], rowCount: res.rowCount || res.rows.length };
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
        sqliteDb!.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve({ rows: rows as T[], rowCount: rows.length });
        });
      } else {
        sqliteDb!.run(sql, params, function (err) {
          if (err) return reject(err);
          // If INSERT/UPDATE/DELETE, handle accordingly
          if (trimmed.startsWith('INSERT')) {
            // Fetch inserted row if possible or return changes
            resolve({ rows: [{ id: this.lastID }] as any, rowCount: this.changes });
          } else {
            resolve({ rows: [], rowCount: this.changes });
          }
        });
      }
    });
  } else {
    throw new Error('No database connection initialized');
  }
};

export const initDb = async () => {
  const isPg = isPostgres;
  const autoIncPk = isPg ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const timestampType = isPg ? 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';

  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id ${autoIncPk},
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'Member',
      avatar_url VARCHAR(255),
      created_at ${timestampType}
    );
  `);

  // Teams table
  await query(`
    CREATE TABLE IF NOT EXISTS teams (
      id ${autoIncPk},
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at ${timestampType}
    );
  `);

  // Team Members table
  await query(`
    CREATE TABLE IF NOT EXISTS team_members (
      id ${autoIncPk},
      team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL DEFAULT 'Member',
      joined_at ${timestampType},
      UNIQUE(team_id, user_id)
    );
  `);

  // Projects table
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id ${autoIncPk},
      name VARCHAR(100) NOT NULL,
      description TEXT,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      status VARCHAR(30) NOT NULL DEFAULT 'Planning',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at ${timestampType}
    );
  `);

  // Tasks table
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id ${autoIncPk},
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'To Do',
      priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      due_date VARCHAR(50),
      estimated_hours REAL DEFAULT 0,
      created_at ${timestampType},
      updated_at ${timestampType}
    );
  `);

  // Comments table
  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id ${autoIncPk},
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at ${timestampType}
    );
  `);

  // Refresh Tokens table
  await query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id ${autoIncPk},
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at VARCHAR(100) NOT NULL,
      created_at ${timestampType}
    );
  `);

  // Indexes for high performance list queries & pagination
  await query(`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
};
