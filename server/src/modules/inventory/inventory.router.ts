import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '@middlewares/authenticate';
import { authorize } from '@middlewares/authorize';

const router = Router();
const ctrl = new InventoryController();

router.use(authenticate);

// Brands
router.get('/brands', ctrl.listBrands);
router.post('/brands', authorize('admin', 'inventory_manager'), ctrl.createBrand);
router.put('/brands/:id', authorize('admin', 'inventory_manager'), ctrl.updateBrand);
router.delete('/brands/:id', authorize('admin'), ctrl.deleteBrand);

// Categories
router.get('/categories', ctrl.listCategories);
router.post('/categories', authorize('admin', 'inventory_manager'), ctrl.createCategory);
router.put('/categories/:id', authorize('admin', 'inventory_manager'), ctrl.updateCategory);
router.delete('/categories/:id', authorize('admin'), ctrl.deleteCategory);

// Products
router.get('/products', ctrl.listProducts);
router.get('/products/:id', ctrl.getProduct);
router.post('/products', authorize('admin', 'inventory_manager'), ctrl.createProduct);
router.put('/products/:id', authorize('admin', 'inventory_manager'), ctrl.updateProduct);
router.delete('/products/:id', authorize('admin'), ctrl.deleteProduct);

// Variants (nested under product)
router.get('/products/:productId/variants', ctrl.listVariants);
router.post('/products/:productId/variants', authorize('admin', 'inventory_manager'), ctrl.createVariant);
router.put('/variants/:id', authorize('admin', 'inventory_manager'), ctrl.updateVariant);
router.patch('/variants/:id/stock', authorize('admin', 'inventory_manager', 'cashier'), ctrl.adjustStock);
router.delete('/variants/:id', authorize('admin'), ctrl.deleteVariant);

export default router;
