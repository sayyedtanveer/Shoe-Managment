import { Router } from 'express';
import { TenantController } from './tenant.controller';
import { authenticate } from '@middlewares/authenticate';
import { authorize } from '@middlewares/authorize';

const router = Router();
const ctrl = new TenantController();

// Super-admin only (no shopId – works on root domain)
router.use(authenticate, authorize('admin'));

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/deactivate', ctrl.deactivate);

export default router;
