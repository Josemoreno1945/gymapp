// ============================================================
// Entry Point — Express Server Setup
// ============================================================

import 'dotenv/config'; // Auto-load .env
import express from 'express';
import cors from 'cors';

import { getDatabase, closeDatabase } from './config/database.js';
import { logger, requestLogger } from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import trainingRoutes from './routes/training.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import usersRoutes from './routes/users.routes.js';
import aiRoutes from './routes/ai.routes.js';
import semanasRoutes from './routes/semanas.routes.js';
import diasRoutes from './routes/dias.routes.js';
import ejerciciosRoutes from './routes/ejercicios.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://gymtrackerappl.netlify.app' 
    : (process.env.CORS_ORIGIN || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json());
app.use(requestLogger);

// ─── Initialize DB ───────────────────────────────────────────
try {
  getDatabase();
} catch (error) {
  logger.error('Failed to initialize database:', error.message);
  process.exit(1);
}

// ─── Routes ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ ok: true, mensaje: 'NeonBench SaaS API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/semanas', semanasRoutes);
app.use('/api', diasRoutes);
app.use('/api/ejercicios', ejerciciosRoutes);

// ─── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.success(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// ─── Graceful Shutdown ───────────────────────────────────────
function shutdown() {
  logger.info('Shutting down server...');
  server.close(() => {
    closeDatabase();
    logger.success('Server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
