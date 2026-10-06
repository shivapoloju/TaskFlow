import app, { setupAppDatabase } from './app';
import { config } from './config/database';

const startServer = async () => {
  try {
    await setupAppDatabase();
    app.listen(config.port, () => {
      console.log(`🚀 TaskFlow Backend REST API server running on port ${config.port}`);
      console.log(`📖 Swagger API Docs available at http://localhost:${config.port}/api-docs`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
