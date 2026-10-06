import bcrypt from 'bcryptjs';
import { query, initDb } from '../services/dbService';

export const seedDatabase = async (seededRowsCount: number = 250) => {
  console.log('🌱 Starting TaskFlow database seeding...');
  await initDb();

  // Clear existing data
  await query('DELETE FROM comments');
  await query('DELETE FROM tasks');
  await query('DELETE FROM projects');
  await query('DELETE FROM team_members');
  await query('DELETE FROM teams');
  await query('DELETE FROM refresh_tokens');
  await query('DELETE FROM users');

  console.log('Clearing old data complete. Creating seed users...');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // Default demo accounts for each role
  const adminRes = await query(
    'INSERT INTO users (name, email, password, role, avatar_url) VALUES (?, ?, ?, ?, ?) RETURNING id',
    ['System Admin', 'admin@taskflow.dev', defaultPassword, 'Admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200']
  );
  const adminId = adminRes.rows[0]?.id || 1;

  const managerRes = await query(
    'INSERT INTO users (name, email, password, role, avatar_url) VALUES (?, ?, ?, ?, ?) RETURNING id',
    ['Sarah Jenkins (Manager)', 'manager@taskflow.dev', defaultPassword, 'Manager', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200']
  );
  const managerId = managerRes.rows[0]?.id || 2;

  const memberRes = await query(
    'INSERT INTO users (name, email, password, role, avatar_url) VALUES (?, ?, ?, ?, ?) RETURNING id',
    ['Alex Rivera (Member)', 'member@taskflow.dev', defaultPassword, 'Member', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200']
  );
  const memberId = memberRes.rows[0]?.id || 3;

  // Additional team members
  const extraUsers = [
    { name: 'Emily Chen', email: 'emily@taskflow.dev', role: 'Member', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200' },
    { name: 'David Kim', email: 'david@taskflow.dev', role: 'Manager', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
    { name: 'Jessica Taylor', email: 'jessica@taskflow.dev', role: 'Member', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' }
  ];

  const userIds = [adminId, managerId, memberId];
  for (const u of extraUsers) {
    const res = await query(
      'INSERT INTO users (name, email, password, role, avatar_url) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [u.name, u.email, defaultPassword, u.role, u.avatar]
    );
    if (res.rows[0]?.id) userIds.push(res.rows[0].id);
  }

  // Create Teams
  const teamsData = [
    { name: 'Engineering & DevOps', description: 'Core product architecture, CI/CD pipelines & infrastructure.' },
    { name: 'Product Design & UX', description: 'Design systems, wireframing & usability testing.' },
    { name: 'Growth Marketing', description: 'Customer acquisition, SEO optimization & brand campaigns.' }
  ];

  const teamIds: number[] = [];
  for (const t of teamsData) {
    const res = await query(
      'INSERT INTO teams (name, description, created_by) VALUES (?, ?, ?) RETURNING id',
      [t.name, t.description, adminId]
    );
    const tid = res.rows[0]?.id || (teamIds.length + 1);
    teamIds.push(tid);

    // Add members to teams
    for (const uid of userIds) {
      await query('INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [
        tid,
        uid,
        uid === adminId ? 'Admin' : uid === managerId ? 'Manager' : 'Member'
      ]);
    }
  }

  // Create Projects
  const projectsData = [
    { name: 'TaskFlow 2.0 Web Platform', description: 'Next-gen team collaboration dashboard built with React & TypeScript.', team_id: teamIds[0], status: 'In Progress' },
    { name: 'PostgreSQL Relational Schema & Indexing', description: 'Database query optimization and server-side pagination engine.', team_id: teamIds[0], status: 'Completed' },
    { name: 'Docker & GitHub Actions CI/CD Pipeline', description: 'Containerized microservice setup with automated test suites.', team_id: teamIds[0], status: 'In Progress' },
    { name: 'Design System & UI Components', description: 'Glassmorphic component library and typography guidelines.', team_id: teamIds[1], status: 'Planning' },
    { name: 'Q4 Product Launch Campaign', description: 'Multi-channel marketing strategy & conversion analytics.', team_id: teamIds[2], status: 'On Hold' }
  ];

  const projectIds: number[] = [];
  for (const p of projectsData) {
    const res = await query(
      'INSERT INTO projects (name, description, team_id, status, created_by) VALUES (?, ?, ?, ?, ?) RETURNING id',
      [p.name, p.description, p.team_id, p.status, managerId]
    );
    const pid = res.rows[0]?.id || (projectIds.length + 1);
    projectIds.push(pid);
  }

  // Sample tasks
  const curatedTasks = [
    { title: 'Implement JWT Refresh Token Rotation', status: 'Completed', priority: 'High', projId: projectIds[0], est: 8 },
    { title: 'Role-Based Access Control (Admin/Manager/Member)', status: 'In Progress', priority: 'High', projId: projectIds[0], est: 6 },
    { title: 'Add OpenAPI/Swagger REST Documentation', status: 'Completed', priority: 'Medium', projId: projectIds[1], est: 4 },
    { title: 'Optimize SQL JOIN Queries with Indexes', status: 'Completed', priority: 'High', projId: projectIds[1], est: 12 },
    { title: 'Setup GitHub Actions CI/CD for Render & Vercel', status: 'In Progress', priority: 'High', projId: projectIds[2], est: 10 },
    { title: 'Design Glassmorphic Task Card Component', status: 'To Do', priority: 'Low', projId: projectIds[3], est: 5 },
    { title: 'Write Jest & Supertest Integration Tests', status: 'In Progress', priority: 'Medium', projId: projectIds[0], est: 8 },
    { title: 'Containerize Backend & Frontend with Docker', status: 'Completed', priority: 'High', projId: projectIds[2], est: 7 }
  ];

  for (let i = 0; i < curatedTasks.length; i++) {
    const task = curatedTasks[i];
    const assignee = userIds[i % userIds.length];
    const res = await query(
      `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, reporter_id, due_date, estimated_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        task.title,
        `Task detail description for ${task.title}. Ensures robust task management workflow.`,
        task.status,
        task.priority,
        task.projId,
        assignee,
        managerId,
        new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
        task.est
      ]
    );
    const taskId = res.rows[0]?.id || (i + 1);

    // Add comments
    await query('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)', [
      taskId,
      managerId,
      `Please ensure all unit tests pass before moving "${task.title}" to completed state.`
    ]);
    await query('INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)', [
      taskId,
      assignee,
      `Working on this task. Implementation in progress.`
    ]);
  }

  // Seed high volume rows to demonstrate 10,000+ indexed query efficiency
  console.log(`⚡ Generating ${seededRowsCount} seeded tasks for performance benchmark tests...`);
  const statuses = ['To Do', 'In Progress', 'In Review', 'Completed'];
  const priorities = ['Low', 'Medium', 'High'];
  const taskPrefixes = [
    'Refactor Module', 'Audit API Endpoint', 'Fix Memory Leak in', 'Add Unit Tests for',
    'Benchmark Database Query', 'Configure SSL Cert for', 'Update Dependency Package',
    'Review PR for', 'Optimize Render Latency in', 'Implement Webhook for'
  ];

  for (let i = 1; i <= seededRowsCount; i++) {
    const randomStatus = statuses[i % statuses.length];
    const randomPriority = priorities[i % priorities.length];
    const randomProject = projectIds[i % projectIds.length];
    const randomAssignee = userIds[i % userIds.length];
    const title = `${taskPrefixes[i % taskPrefixes.length]} #${1000 + i}`;

    await query(
      `INSERT INTO tasks (title, description, status, priority, project_id, assignee_id, reporter_id, due_date, estimated_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        `High-volume seeded row #${i} for PostgreSQL indexed query benchmarks.`,
        randomStatus,
        randomPriority,
        randomProject,
        randomAssignee,
        adminId,
        '2026-11-15',
        (i % 12) + 1
      ]
    );
  }

  console.log(`✅ Successfully seeded database with default demo accounts & ${seededRowsCount} tasks!`);
};

if (require.main === module) {
  seedDatabase(500)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
