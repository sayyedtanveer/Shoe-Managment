import { Router } from 'express';
import { TenantController } from './tenant.controller';
import { platformApiKey } from '@middlewares/platformApiKey';

const router = Router();
const ctrl = new TenantController();

// Platform-level API key protection (no shopId – root domain)
router.use(platformApiKey);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/deactivate', ctrl.deactivate);

export default router;
