import { Router } from 'express';
import { OrderController } from './order.controller';
import { authenticate } from '@middlewares/authenticate';
import { authorize } from '@middlewares/authorize';

const router = Router();
const ctrl = new OrderController();

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin', 'salesman', 'cashier'), ctrl.create);
router.get('/pending/self', authorize('salesman'), ctrl.listPendingForSalesman);
router.get('/queue', authorize('admin', 'cashier'), ctrl.queue);
router.put('/:id/complete', authorize('admin', 'cashier'), ctrl.complete);
router.post('/:id/void', authorize('admin'), ctrl.voidOrder);
router.patch('/:id/status', authorize('admin', 'cashier'), ctrl.updateStatus);

export default router;
