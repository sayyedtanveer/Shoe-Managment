import { Router } from 'express';
import { authenticate } from '@middlewares/authenticate';
import { OfflineController } from './offline.controller';

const router = Router();
const ctrl = new OfflineController();

router.use(authenticate);

router.post('/', ctrl.enqueue);

export default router;

