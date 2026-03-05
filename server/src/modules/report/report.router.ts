import { Router } from 'express';
import { authenticate } from '@middlewares/authenticate';
import { ReportController } from './report.controller';

const router = Router();
const ctrl = new ReportController();

router.use(authenticate);
router.get('/sales', ctrl.sales);
router.get('/inventory', ctrl.inventory);
router.get('/gst', ctrl.gst);

export default router;
