import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/authRoutes';
import teamRoutes from './routes/teamRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import commentRoutes from './routes/commentRoutes';
import { errorHandler } from './middleware/errorHandler';
import { initDb, query } from './services/dbService';
import { seedDatabase } from './scripts/seed';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger OpenAPI UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Healthcheck endpoint
app.get('/health', async (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'TaskFlow REST API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

// Catch-all 404 for API
app.use('/api/*', (_req, res) => {
  res.status(404).json({ status: 'error', message: 'API route not found' });
});

// Centralized Error Handler
app.use(errorHandler);

// Helper to initialize DB and auto-seed demo users if missing
export const setupAppDatabase = async () => {
  await initDb();
  const adminCheck = await query('SELECT id FROM users WHERE email = ?', ['admin@taskflow.dev']);
  if (adminCheck.rows.length === 0) {
    console.log('Demo accounts missing, running database seed...');
    await seedDatabase(250);
  }
};

export default app;
