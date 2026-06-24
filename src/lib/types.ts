export type Category = 'Dryck' | 'Mat' | 'Glass' | 'Godis';

export interface Product {
  id: string;
  name: string;
  price: number;
  slug: string;
  category: Category;
  image?: string | null;
  hygraph_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Sale {
  id: string;
  sum: number;
  payment_method: string;
  time: string;
  text?: string | null;
  fullfilled?: boolean;
}

export interface SoldItem {
  id: string;
  sale_id: string;
  product_id: string;
  price: number;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CreateProductInput {
  name: string;
  price: number;
  slug: string;
  category: Category;
  image?: string;
}

export interface UpdateProductInput {
  name: string;
  price: number;
  slug: string;
  category: Category;
  image?: string;
}

export interface CreateSaleInput {
  sum: number;
  paymentMethod: string;
  soldItems: CartItem[];
  text?: string;
}

export interface PieChartDatum {
  label: string;
  value: number;
  color: string;
}

export interface ProductRow {
  name: string;
  price: string;
  category: Category;
  slug: string;
  image: string;
}

export interface SoldItemWithProduct extends SoldItem {
  name?: string;
  category?: Category;
}

export interface SaleWithItems extends Sale {
  soldItems: SoldItemWithProduct[];
}

export interface CategorySummary {
  sum: number;
  count: number;
}
