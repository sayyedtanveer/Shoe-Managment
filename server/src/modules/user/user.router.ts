import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '@middlewares/authenticate';
import { authorize } from '@middlewares/authorize';

const router = Router();
const ctrl = new UserController();

router.use(authenticate);

router.get('/', authorize('admin'), ctrl.list);
router.get('/:id', authorize('admin'), ctrl.getById);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.patch('/:id/activate', authorize('admin'), ctrl.activate);
router.patch('/:id/deactivate', authorize('admin'), ctrl.deactivate);

export default router;
