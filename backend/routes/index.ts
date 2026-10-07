import { Router } from 'express';
import authRoutes from './authRoutes.js';
import guestRoutes from './guestRoutes.js';
import tableRoutes from './tableRoutes.js';
import statsRoutes from './statsRoutes.js';
import exportRoutes from './exportRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/guests', guestRoutes);
apiRouter.use('/tables', tableRoutes);
apiRouter.use('/stats', statsRoutes);
apiRouter.use('/export', exportRoutes);

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wedding-guest-manager-api', timestamp: new Date().toISOString() });
});

export default apiRouter;
