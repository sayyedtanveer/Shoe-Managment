import { create } from 'zustand';

interface InventoryFilters {
    brandId?: number;
    categoryId?: number;
    search?: string;
    page: number;
    pageSize: number;
    setBrandId: (id?: number) => void;
    setCategoryId: (id?: number) => void;
    setSearch: (s?: string) => void;
    setPage: (p: number) => void;
}

export const useInventoryFilterStore = create<InventoryFilters>((set) => ({
    brandId: undefined,
    categoryId: undefined,
    search: '',
    page: 1,
    pageSize: 20,
    setBrandId: (brandId) => set({ brandId, page: 1 }),
    setCategoryId: (categoryId) => set({ categoryId, page: 1 }),
    setSearch: (search) => set({ search, page: 1 }),
    setPage: (page) => set({ page }),
}));

