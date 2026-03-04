import prisma from '@infrastructure/database/prisma';
import { Brand, Category, Product, ProductVariant, Prisma, Location } from '@prisma/client';

// ── Brands ──────────────────────────────────────────────────

export class BrandRepository {
    findAll(shopId: string): Promise<Brand[]> {
        return prisma.brand.findMany({ where: { shopId }, orderBy: { name: 'asc' } });
    }
    findById(id: number, shopId: string): Promise<Brand | null> {
        return prisma.brand.findFirst({ where: { id, shopId } });
    }
    create(data: Prisma.BrandCreateInput): Promise<Brand> {
        return prisma.brand.create({ data });
    }
    update(id: number, data: Prisma.BrandUpdateInput): Promise<Brand> {
        return prisma.brand.update({ where: { id }, data });
    }
    delete(id: number): Promise<Brand> {
        return prisma.brand.delete({ where: { id } });
    }
}

export class LocationRepository {
    findAll(shopId: string): Promise<Location[]> {
        return prisma.location.findMany({ where: { shopId }, orderBy: { name: 'asc' } });
    }

    findById(id: number, shopId: string): Promise<Location | null> {
        return prisma.location.findFirst({ where: { id, shopId } });
    }

    create(data: Prisma.LocationCreateInput): Promise<Location> {
        return prisma.location.create({ data });
    }

    update(id: number, data: Prisma.LocationUpdateInput): Promise<Location> {
        return prisma.location.update({ where: { id }, data });
    }

    delete(id: number): Promise<Location> {
        return prisma.location.delete({ where: { id } });
    }
}

// ── Categories ───────────────────────────────────────────────

export class CategoryRepository {
    findAll(shopId: string): Promise<Category[]> {
        return prisma.category.findMany({
            where: { shopId },
            include: { children: true },
            orderBy: { name: 'asc' },
        });
    }
    findById(id: number, shopId: string): Promise<Category | null> {
        return prisma.category.findFirst({ where: { id, shopId } });
    }
    create(data: Prisma.CategoryCreateInput): Promise<Category> {
        return prisma.category.create({ data });
    }
    update(id: number, data: Prisma.CategoryUpdateInput): Promise<Category> {
        return prisma.category.update({ where: { id }, data });
    }
    delete(id: number): Promise<Category> {
        return prisma.category.delete({ where: { id } });
    }
}

// ── Products ─────────────────────────────────────────────────

export class ProductRepository {
    findAll(
        shopId: string,
        filters: {
            brandId?: number;
            categoryId?: number;
            isActive?: boolean;
            page: number;
            pageSize: number;
            search?: string;
        }
    ): Promise<Product[]> {
        const where: Prisma.ProductWhereInput = {
            shopId,
            ...(filters.brandId && { brandId: filters.brandId }),
            ...(filters.categoryId && { categoryId: filters.categoryId }),
            ...(filters.isActive !== undefined && { isActive: filters.isActive }),
            ...(filters.search && {
                model: { contains: filters.search, mode: 'insensitive' },
            }),
        };

        return prisma.product.findMany({
            where,
            include: { brand: true, category: true, variants: true },
            orderBy: { createdAt: 'desc' },
            skip: (filters.page - 1) * filters.pageSize,
            take: filters.pageSize,
        });
    }

    findById(id: string, shopId: string): Promise<Product | null> {
        return prisma.product.findFirst({
            where: { id, shopId },
            include: { brand: true, category: true, variants: { include: { location: true } } },
        });
    }

    create(data: Prisma.ProductCreateInput): Promise<Product> {
        return prisma.product.create({ data, include: { brand: true, category: true } });
    }

    update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
        return prisma.product.update({ where: { id }, data });
    }

    delete(id: string): Promise<Product> {
        return prisma.product.update({
            where: { id },
            data: { isActive: false },
        });
    }
}

// ── Product Variants ─────────────────────────────────────────

export class VariantRepository {
    findByProduct(productId: string): Promise<ProductVariant[]> {
        return prisma.productVariant.findMany({
            where: { productId },
            include: { location: true },
            orderBy: { size: 'asc' },
        });
    }

    findById(id: string): Promise<ProductVariant | null> {
        return prisma.productVariant.findUnique({ where: { id } });
    }

    create(data: Prisma.ProductVariantCreateInput): Promise<ProductVariant> {
        return prisma.productVariant.create({ data });
    }

    update(id: string, data: Prisma.ProductVariantUpdateInput): Promise<ProductVariant> {
        return prisma.productVariant.update({ where: { id }, data });
    }

    adjustStock(id: string, delta: number): Promise<ProductVariant> {
        return prisma.productVariant.update({
            where: { id },
            data: { quantity: { increment: delta } },
        });
    }

    delete(id: string): Promise<ProductVariant> {
        return prisma.productVariant.delete({ where: { id } });
    }
}
