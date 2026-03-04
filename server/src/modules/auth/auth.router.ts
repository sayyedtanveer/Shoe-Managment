import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '@middlewares/authenticate';

const router = Router();
const ctrl = new AuthController();

// Public routes
router.post('/login', ctrl.login);
router.post('/pin-login', ctrl.pinLogin);
router.post('/refresh', ctrl.refresh);

// Protected routes
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);

export default router;
