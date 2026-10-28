import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './server/db.js';
import { apiRouter } from './server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize and verify database (MongoDB Atlas or documented dev fallback)
  await initDatabase();

  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  // Support JSON bodies up to 10MB for base64 images
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'AgriTech',
      timestamp: new Date().toISOString(),
    });
  });

  if (!isProduction) {
    // In dev, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[AgriTech] Vite dev server mounted in middleware mode');
  } else {
    // In production, serve built static assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[AgriTech] Serving static files from dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AgriTech] Digital Farming Platform listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AgriTech] Fatal error during server startup:', err);
  process.exit(1);
});
