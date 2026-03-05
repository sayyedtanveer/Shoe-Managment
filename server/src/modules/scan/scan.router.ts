import { Router } from 'express';
import { authenticate } from '@middlewares/authenticate';
import { ScanController } from './scan.controller';

const router = Router();
const ctrl = new ScanController();

router.use(authenticate);

router.get('/:code', ctrl.scanByCode);

export default router;

