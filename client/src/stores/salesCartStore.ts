import { create } from 'zustand';

export interface CartItem {
    variantId: string;
    productName: string;
    size?: number | null;
    color?: string | null;
    price: number;
    quantity: number;
}

interface SalesCartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    clear: () => void;
}

export const useSalesCartStore = create<SalesCartState>((set) => ({
    items: [],
    addItem: (item, quantity) =>
        set((state) => {
            const existing = state.items.find((i) => i.variantId === item.variantId);
            if (existing) {
                return {
                    items: state.items.map((i) =>
                        i.variantId === item.variantId
                            ? { ...i, quantity: i.quantity + quantity }
                            : i
                    ),
                };
            }
            return { items: [...state.items, { ...item, quantity }] };
        }),
    updateQuantity: (variantId, quantity) =>
        set((state) => ({
            items: state.items.map((i) =>
                i.variantId === variantId ? { ...i, quantity } : i
            ),
        })),
    clear: () => set({ items: [] }),
}));

