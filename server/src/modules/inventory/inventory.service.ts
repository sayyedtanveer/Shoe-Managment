import { Prisma } from '@prisma/client';
import {
    BrandRepository,
    CategoryRepository,
    LocationRepository,
    ProductRepository,
    VariantRepository,
} from './inventory.repository';
import { NotFoundError, BadRequestError } from '@core/ApiError';
import { recordAudit } from '@core/audit';

export class InventoryService {
    private brands = new BrandRepository();
    private categories = new CategoryRepository();
    private locations = new LocationRepository();
    private products = new ProductRepository();
    private variants = new VariantRepository();

    private async ensureBrandInShop(id: number, shopId: string) {
        const entity = await this.brands.findById(id, shopId);
        if (!entity) throw new NotFoundError('Brand not found');
        return entity;
    }

    private async ensureCategoryInShop(id: number, shopId: string) {
        const entity = await this.categories.findById(id, shopId);
        if (!entity) throw new NotFoundError('Category not found');
        return entity;
    }

    private async ensureProductInShop(id: string, shopId: string) {
        const entity = await this.products.findById(id, shopId);
        if (!entity) throw new NotFoundError('Product not found');
        return entity;
    }

    private async ensureVariantInShop(id: string, shopId: string) {
        const entity = await this.variants.findById(id);
        if (!entity || entity.shopId !== shopId) throw new NotFoundError('Variant not found');
        return entity;
    }

    // ── Brands ──────────────────────────────────────────────────
    listBrands(shopId: string) { return this.brands.findAll(shopId); }

    async getBrand(id: number, shopId: string) {
        return this.ensureBrandInShop(id, shopId);
    }

    createBrand(shopId: string, name: string, gstRate?: number) {
        return this.brands.create({
            shop: { connect: { id: shopId } },
            name,
            gstRate: gstRate ?? 5,
        });
    }

    async updateBrand(id: number, shopId: string, data: { name?: string; gstRate?: number }) {
        const before = await this.ensureBrandInShop(id, shopId);
        const updated = await this.brands.update(id, data);
        await recordAudit({
            shopId,
            action: 'brand.update',
            entityType: 'brand',
            entityId: String(id),
            oldData: before,
            newData: updated,
        });
        return updated;
    }

    async deleteBrand(id: number, shopId: string) {
        const before = await this.ensureBrandInShop(id, shopId);
        const deleted = await this.brands.delete(id);
        await recordAudit({
            shopId,
            action: 'brand.delete',
            entityType: 'brand',
            entityId: String(id),
            oldData: before,
            newData: deleted,
        });
        return deleted;
    }

    // ── Locations ────────────────────────────────────────────────
    listLocations(shopId: string) { return this.locations.findAll(shopId); }

    async getLocation(id: number, shopId: string) {
        const loc = await this.locations.findById(id, shopId);
        if (!loc) throw new NotFoundError('Location not found');
        return loc;
    }

    createLocation(shopId: string, name: string, isActive?: boolean) {
        return this.locations.create({
            shop: { connect: { id: shopId } },
            name,
            isActive: isActive ?? true,
        });
    }

    async updateLocation(id: number, shopId: string, data: { name?: string; isActive?: boolean }) {
        await this.getLocation(id, shopId);
        return this.locations.update(id, data);
    }

    async deleteLocation(id: number, shopId: string) {
        await this.getLocation(id, shopId);
        return this.locations.delete(id);
    }

    // ── Categories ───────────────────────────────────────────────
    listCategories(shopId: string) { return this.categories.findAll(shopId); }

    async getCategory(id: number, shopId: string) {
        return this.ensureCategoryInShop(id, shopId);
    }

    createCategory(shopId: string, name: string, parentId?: number) {
        const data: Prisma.CategoryCreateInput = {
            shop: { connect: { id: shopId } },
            name,
            ...(parentId && { parent: { connect: { id: parentId } } }),
        };
        return this.categories.create(data);
    }

    async updateCategory(id: number, shopId: string, data: { name?: string; parentId?: number }) {
        await this.ensureCategoryInShop(id, shopId);
        return this.categories.update(id, data as Prisma.CategoryUpdateInput);
    }

    async deleteCategory(id: number, shopId: string) {
        await this.ensureCategoryInShop(id, shopId);
        return this.categories.delete(id);
    }

    // ── Products ─────────────────────────────────────────────────
    listProducts(shopId: string, filters: { brandId?: number; categoryId?: number }) {
        return this.products.findAll(shopId, filters);
    }

    async getProduct(id: string, shopId: string) {
        return this.ensureProductInShop(id, shopId);
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

    async updateProduct(id: string, shopId: string, data: Prisma.ProductUpdateInput) {
        const before = await this.ensureProductInShop(id, shopId);
        const updated = await this.products.update(id, data);
        await recordAudit({
            shopId,
            action: 'product.update',
            entityType: 'product',
            entityId: id,
            oldData: before,
            newData: updated,
        });
        return updated;
    }

    async softDeleteProduct(id: string, shopId: string) {
        const before = await this.ensureProductInShop(id, shopId);
        const deleted = await this.products.delete(id);
        await recordAudit({
            shopId,
            action: 'product.deactivate',
            entityType: 'product',
            entityId: id,
            oldData: before,
            newData: deleted,
        });
        return deleted;
    }

    // ── Variants ─────────────────────────────────────────────────
    async listVariants(productId: string, shopId: string) {
        await this.ensureProductInShop(productId, shopId);
        return this.variants.findByProduct(productId);
    }

    async getVariant(id: string, shopId: string) {
        return this.ensureVariantInShop(id, shopId);
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

    async adjustStock(id: string, shopId: string, delta: number) {
        const variant = await this.getVariant(id, shopId);
        if (variant.quantity + delta < 0) {
            throw new BadRequestError('Insufficient stock');
        }
        return this.variants.adjustStock(id, delta);
    }

    async updateVariant(id: string, shopId: string, data: Prisma.ProductVariantUpdateInput) {
        await this.getVariant(id, shopId);
        return this.variants.update(id, data);
    }

    async deleteVariant(id: string, shopId: string) {
        await this.getVariant(id, shopId);
        return this.variants.delete(id);
    }
}
