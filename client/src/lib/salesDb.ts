import Dexie, { Table } from 'dexie';

export interface CachedProduct {
    variantId: string;
    productName: string;
    size?: number | null;
    color?: string | null;
    price: number;
    image?: string | null;
    updatedAt: number;
}

export interface PendingOrder {
    id?: number;
    shopId: string;
    salesmanId: string;
    items: { variantId: string; quantity: number }[];
    customerId?: string;
    createdAt: number;
    synced: boolean;
}

export class SalesDb extends Dexie {
    productsCache!: Table<CachedProduct, string>;
    pendingOrders!: Table<PendingOrder, number>;

    constructor() {
        super('shoeflow_sales');
        this.version(1).stores({
            productsCache: '&variantId, updatedAt',
            pendingOrders: '++id, shopId, salesmanId, synced',
        });
    }
}

export const salesDb = new SalesDb();

