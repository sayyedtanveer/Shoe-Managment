/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const shopName = process.env.BOOTSTRAP_SHOP_NAME || 'ShoeFlow Demo';
    const shopSlug = process.env.BOOTSTRAP_SHOP_SLUG || 'demo-shop';
    const adminUsername = process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'admin1234';

    let shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (!shop) {
        shop = await prisma.shop.create({
            data: {
                name: shopName,
                slug: shopSlug,
                plan: 'basic',
                isActive: true,
            },
        });
        console.log(`Created shop "${shop.name}" (${shop.slug})`);
    } else {
        console.log(`Shop "${shop.slug}" already exists`);
    }

    const existingAdmin = await prisma.user.findFirst({
        where: { shopId: shop.id, username: adminUsername },
    });
    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await prisma.user.create({
            data: {
                shopId: shop.id,
                username: adminUsername,
                passwordHash,
                fullName: 'Admin',
                role: 'admin',
                isActive: true,
            },
        });
        console.log(`Created admin user "${adminUsername}" with default password`);
    } else {
        console.log(`Admin user "${adminUsername}" already exists`);
    }
}

main()
    .then(() => {
        console.log('Bootstrap complete');
        return prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('Bootstrap failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });

