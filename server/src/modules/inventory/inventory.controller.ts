import { Request, Response } from 'express';
import { z } from 'zod';
import { BaseController } from '@core/BaseController';
import { sendSuccess } from '@core/ApiResponse';
import { InventoryService } from './inventory.service';
import { BadRequestError } from '@core/ApiError';

const brandSchema = z.object({
    name: z.string().min(1),
    gstRate: z.number().int().min(0).max(100).optional(),
});

const locationSchema = z.object({
    name: z.string().min(1),
    isActive: z.boolean().optional(),
});

const categorySchema = z.object({
    name: z.string().min(1),
    parentId: z.number().int().positive().optional(),
});

const productSchema = z.object({
    brandId: z.number().int().positive().optional(),
    categoryId: z.number().int().positive().optional(),
    model: z.string().min(1),
    description: z.string().optional(),
    purchasePrice: z.number().positive().optional(),
    sellingPrice: z.number().positive().optional(),
    mrp: z.number().positive().optional(),
    gstRate: z.number().int().min(0).max(100).optional(),
    images: z.array(z.string()).optional(),
});

const productFiltersSchema = z.object({
    brandId: z.string().optional(),
    categoryId: z.string().optional(),
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional(),
});

const variantBulkSchema = z.object({
    variants: z
        .array(
            z.object({
                size: z.number().optional(),
                color: z.string().optional(),
                quantity: z.number().int().min(0).optional(),
                locationId: z.number().int().positive().optional(),
                qrCode: z.string().optional(),
            })
        )
        .min(1),
});

const variantUpdateSchema = z.object({
    size: z.number().optional(),
    color: z.string().optional(),
    quantity: z.number().int().min(0).optional(),
    locationId: z.number().int().positive().optional(),
    qrCode: z.string().optional(),
});

const adjustStockSchema = z.object({
    delta: z.number().int(),
});

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
        const parsed = brandSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        const { name, gstRate } = parsed.data;
        sendSuccess(
            res,
            await this.svc.createBrand(this.shopId(req), name, gstRate),
            'Brand created',
            201
        );
    });
    updateBrand = this.asyncHandler(async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        const parsed = brandSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        sendSuccess(
            res,
            await this.svc.updateBrand(id, this.shopId(req), parsed.data),
            'Brand updated'
        );
    });
    deleteBrand = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.deleteBrand(Number(req.params.id), this.shopId(req)), 'Brand deleted');
    });

    // ── Locations ───────────────────────────────────────────────
    listLocations = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.listLocations(this.shopId(req)), 'Locations');
    });
    createLocation = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = locationSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        const { name, isActive } = parsed.data;
        sendSuccess(
            res,
            await this.svc.createLocation(this.shopId(req), name, isActive),
            'Location created',
            201
        );
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
        const parsed = categorySchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        const { name, parentId } = parsed.data;
        sendSuccess(
            res,
            await this.svc.createCategory(this.shopId(req), name, parentId),
            'Category created',
            201
        );
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
        const parsedQuery = productFiltersSchema.safeParse(req.query);
        if (!parsedQuery.success) {
            throw new BadRequestError('Validation failed', parsedQuery.error.errors);
        }
        const { brandId, categoryId, page, pageSize, search } = parsedQuery.data;

        const pageNum = page ? Number(page) || 1 : 1;
        const sizeNum = pageSize ? Number(pageSize) || 20 : 20;

        sendSuccess(
            res,
            await this.svc.listProducts(this.shopId(req), {
                brandId: brandId ? Number(brandId) : undefined,
                categoryId: categoryId ? Number(categoryId) : undefined,
                page: pageNum,
                pageSize: sizeNum,
                search: search,
            }),
            'Products'
        );
    });
    getProduct = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.getProduct(req.params.id, this.shopId(req)), 'Product');
    });
    createProduct = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = productSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        sendSuccess(
            res,
            await this.svc.createProduct(this.shopId(req), parsed.data),
            'Product created',
            201
        );
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
        const parsed = variantBulkSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        const created = await this.svc.createVariantsBulk(
            this.shopId(req),
            req.params.productId,
            parsed.data.variants
        );
        sendSuccess(res, created, 'Variants created', 201);
    });
    updateVariant = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = variantUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        sendSuccess(
            res,
            await this.svc.updateVariant(req.params.id, this.shopId(req), parsed.data),
            'Variant updated'
        );
    });
    adjustStock = this.asyncHandler(async (req: Request, res: Response) => {
        const parsed = adjustStockSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new BadRequestError('Validation failed', parsed.error.errors);
        }
        sendSuccess(
            res,
            await this.svc.adjustStock(req.params.id, this.shopId(req), parsed.data.delta),
            'Stock adjusted'
        );
    });
    deleteVariant = this.asyncHandler(async (req: Request, res: Response) => {
        sendSuccess(res, await this.svc.deleteVariant(req.params.id, this.shopId(req)), 'Variant deleted');
    });
}
