import 'dotenv/config';
import cors from 'cors';
import express, { Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { landscapeRoutes } from './routes/landscape.routes';
import { traceRoutes } from './routes/trace.routes';

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '8079', 10);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes
  app.use('/api/landscape', landscapeRoutes);
  app.use('/api/traces', traceRoutes);

  // Serve static files from the built frontend (production)
  const publicPath = path.join(__dirname, '../../dist/public');
  app.use(express.static(publicPath));

  // Fallback to index.html for client-side routing (SPA)
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  return app;
}

export function startServer(): void {
  const app = createServer();

  app.listen(BACKEND_PORT, () => {
    console.log(String.raw`
  _                                                            _
 | |                                                          | |
 | |_ _ __ __ _  ___ ___ ______ __ _  ___ _ __   ___ _ __ __ _| |_ ___  _ __
 | __|  __/ _  |/ __/ _ \______/ _  |/ _ \  _ \ / _ \  __/ _  | __/ _ \|  __|
 | |_| | | (_| | (_|  __/     | (_| |  __/ | | |  __/ | | (_| | || (_) | |
  \__|_|  \__,_|\___\___|      \__, |\___|_| |_|\___|_|  \__,_|\__\___/|_|
                                __/ |
                               |___/
    `);
    console.log(`Backend server running on http://localhost:${BACKEND_PORT}`);
  });
}

// ESM entry point check
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
