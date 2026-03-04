import { Router } from 'express';
import { CustomerController } from './customer.controller';
import { authenticate } from '@middlewares/authenticate';

const router = Router();
const ctrl = new CustomerController();

router.use(authenticate);

router.get('/', ctrl.list);
router.get('/lookup', ctrl.lookup);         // ?phone=91234...
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/loyalty', ctrl.addLoyalty);

export default router;
