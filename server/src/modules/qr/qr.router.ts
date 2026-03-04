import { Router } from 'express';
import { authenticate } from '@middlewares/authenticate';
import { authorize } from '@middlewares/authorize';
import { QrController } from './qr.controller';

const router = Router();
const ctrl = new QrController();

router.use(authenticate, authorize('admin', 'inventory_manager'));

router.post('/generate', ctrl.generate);
router.get('/print-pdf', ctrl.printPdf);

export default router;

