
import { Product, Category } from './types';

// Em produção, este array inicia vazio e é populado via API/Supabase
export const MOCK_PRODUCTS: Product[] = [];

export const CATEGORIES = Object.values(Category);
