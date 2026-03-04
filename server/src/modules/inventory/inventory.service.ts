import { Prisma } from '@prisma/client';
import {
    BrandRepository,
    CategoryRepository,
    ProductRepository,
    VariantRepository,
} from './inventory.repository';
import { NotFoundError, BadRequestError } from '@core/ApiError';

export class InventoryService {
    private brands = new BrandRepository();
    private categories = new CategoryRepository();
    private products = new ProductRepository();
    private variants = new VariantRepository();

    // ── Brands ──────────────────────────────────────────────────
    listBrands(shopId: string) { return this.brands.findAll(shopId); }

    async getBrand(id: number, shopId: string) {
        const b = await this.brands.findById(id, shopId);
        if (!b) throw new NotFoundError('Brand not found');
        return b;
    }

    createBrand(shopId: string, name: string, gstRate?: number) {
        return this.brands.create({
            shop: { connect: { id: shopId } },
            name,
            gstRate: gstRate ?? 5,
        });
    }

    updateBrand(id: number, shopId: string, data: { name?: string; gstRate?: number }) {
        return this.brands.update(id, data);
    }

    deleteBrand(id: number) { return this.brands.delete(id); }

    // ── Categories ───────────────────────────────────────────────
    listCategories(shopId: string) { return this.categories.findAll(shopId); }

    async getCategory(id: number, shopId: string) {
        const c = await this.categories.findById(id, shopId);
        if (!c) throw new NotFoundError('Category not found');
        return c;
    }

    createCategory(shopId: string, name: string, parentId?: number) {
        const data: Prisma.CategoryCreateInput = {
            shop: { connect: { id: shopId } },
            name,
            ...(parentId && { parent: { connect: { id: parentId } } }),
        };
        return this.categories.create(data);
    }

    updateCategory(id: number, data: { name?: string; parentId?: number }) {
        return this.categories.update(id, data as Prisma.CategoryUpdateInput);
    }

    deleteCategory(id: number) { return this.categories.delete(id); }

    // ── Products ─────────────────────────────────────────────────
    listProducts(shopId: string, filters: { brandId?: number; categoryId?: number }) {
        return this.products.findAll(shopId, filters);
    }

    async getProduct(id: string, shopId: string) {
        const p = await this.products.findById(id, shopId);
        if (!p) throw new NotFoundError('Product not found');
        return p;
    }

    createProduct(shopId: string, dto: {
        brandId?: number; categoryId?: number; model: string; description?: string;
        purchasePrice?: number; sellingPrice?: number; mrp?: number; gstRate?: number; images?: string[];
    }) {
        const data: Prisma.ProductCreateInput = {
            shop: { connect: { id: shopId } },
            model: dto.model,
            description: dto.description,
            purchasePrice: dto.purchasePrice,
            sellingPrice: dto.sellingPrice,
            mrp: dto.mrp,
            gstRate: dto.gstRate,
            images: dto.images ?? [],
            ...(dto.brandId && { brand: { connect: { id: dto.brandId } } }),
            ...(dto.categoryId && { category: { connect: { id: dto.categoryId } } }),
        };
        return this.products.create(data);
    }

    updateProduct(id: string, data: Prisma.ProductUpdateInput) {
        return this.products.update(id, data);
    }

    softDeleteProduct(id: string) { return this.products.delete(id); }

    // ── Variants ─────────────────────────────────────────────────
    listVariants(productId: string) { return this.variants.findByProduct(productId); }

    async getVariant(id: string) {
        const v = await this.variants.findById(id);
        if (!v) throw new NotFoundError('Variant not found');
        return v;
    }

    createVariant(shopId: string, productId: string, dto: {
        size?: number; color?: string; quantity?: number; locationId?: number; qrCode?: string;
    }) {
        const data: Prisma.ProductVariantCreateInput = {
            shop: { connect: { id: shopId } },
            product: { connect: { id: productId } },
            size: dto.size,
            color: dto.color,
            quantity: dto.quantity ?? 0,
            qrCode: dto.qrCode,
            ...(dto.locationId && { location: { connect: { id: dto.locationId } } }),
        };
        return this.variants.create(data);
    }

    async adjustStock(id: string, delta: number) {
        const variant = await this.getVariant(id);
        if (variant.quantity + delta < 0) {
            throw new BadRequestError('Insufficient stock');
        }
        return this.variants.adjustStock(id, delta);
    }

    updateVariant(id: string, data: Prisma.ProductVariantUpdateInput) {
        return this.variants.update(id, data);
    }

    deleteVariant(id: string) { return this.variants.delete(id); }
}
