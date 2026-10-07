import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', requireAuth, AuthController.getMe);
router.post('/reset-data', requireAuth, AuthController.resetData);

export default router;
