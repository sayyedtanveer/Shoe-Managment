import { Request, Response } from 'express';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import { InventoryService } from './inventory.service';
import { BadRequestError } from '@core/ApiError';

export class InventoryController extends BaseController {
    private svc = new InventoryService();

    private shopId(req: Request): string {
        if (!req.shopId) throw new BadRequestError('Tenant context required');
        return req.shopId;
    }

    // ── Brands ──────────────────────────────────────────────────
    listBrands = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.listBrands(this.shopId(req)), 'Brands');
    });
    createBrand = this.asyncHandler(async (req: Request, res: Response) => {
        const { name, gstRate } = req.body;
        sendSuccess(res, await this.svc.createBrand(this.shopId(req), name, gstRate), 'Brand created', 201);
    });
    updateBrand = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.updateBrand(Number(req.params.id), this.shopId(req), req.body), 'Brand updated');
    });
    deleteBrand = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.deleteBrand(Number(req.params.id), this.shopId(req)), 'Brand deleted');
    });

    // ── Locations ───────────────────────────────────────────────
    listLocations = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.listLocations(this.shopId(req)), 'Locations');
    });
    createLocation = this.asyncHandler(async (req: Request, res: Response) => {
        const { name, isActive } = req.body;
        sendSuccess(res, await this.svc.createLocation(this.shopId(req), name, isActive), 'Location created', 201);
    });
    updateLocation = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(
            res,
            await this.svc.updateLocation(Number(req.params.id), this.shopId(req), req.body),
            'Location updated'
        );
    });
    deleteLocation = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.deleteLocation(Number(req.params.id), this.shopId(req)), 'Location deleted');
    });

    // ── Categories ───────────────────────────────────────────────
    listCategories = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.listCategories(this.shopId(req)), 'Categories');
    });
    createCategory = this.asyncHandler(async (req: Request, res: Response) => {
        const { name, parentId } = req.body;
        sendSuccess(res, await this.svc.createCategory(this.shopId(req), name, parentId), 'Category created', 201);
    });
    updateCategory = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(
            res,
            await this.svc.updateCategory(Number(req.params.id), this.shopId(req), req.body),
            'Category updated'
        );
    });
    deleteCategory = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.deleteCategory(Number(req.params.id), this.shopId(req)), 'Category deleted');
    });

    // ── Products ─────────────────────────────────────────────────
    listProducts = this.asyncHandler(async (req: Request, res: Response) => {
        const { brandId, categoryId } = req.query;
        sendSuccess(
            res,
            await this.svc.listProducts(this.shopId(req), {
                brandId: brandId ? Number(brandId) : undefined,
                categoryId: categoryId ? Number(categoryId) : undefined,
            }),
            'Products'
        );
    });
    getProduct = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.getProduct(req.params.id, this.shopId(req)), 'Product');
    });
    createProduct = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.createProduct(this.shopId(req), req.body), 'Product created', 201);
    });
    updateProduct = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.updateProduct(req.params.id, this.shopId(req), req.body), 'Product updated');
    });
    deleteProduct = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.softDeleteProduct(req.params.id, this.shopId(req)), 'Product deactivated');
    });

    // ── Variants ─────────────────────────────────────────────────
    listVariants = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.listVariants(req.params.productId, this.shopId(req)), 'Variants');
    });
    createVariant = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.createVariant(this.shopId(req), req.params.productId, req.body), 'Variant created', 201);
    });
    updateVariant = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.updateVariant(req.params.id, this.shopId(req), req.body), 'Variant updated');
    });
    adjustStock = this.asyncHandler(async (req: Request, res: Response) => {
        const { delta } = req.body;
        sendSuccess(res, await this.svc.adjustStock(req.params.id, this.shopId(req), Number(delta)), 'Stock adjusted');
    });
    deleteVariant = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.deleteVariant(req.params.id, this.shopId(req)), 'Variant deleted');
    });
}
