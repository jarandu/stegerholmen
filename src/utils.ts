import imagesManifest from './generated/images-manifest.json';
import type {
  CreateProductInput,
  CreateSaleInput,
  Product,
  Sale,
  SoldItem,
} from './lib/types';

export const fetchSales = async (): Promise<Sale[]> => {
  const response = await fetch('/api/sales');
  if (!response.ok) throw new Error('Failed to fetch sales');
  return response.json();
};

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

export const getProducts = async (): Promise<Product[]> => {
  try {
    const cached = localStorage.getItem('products');
    const cachedTime = localStorage.getItem('products_cached_at');
    const now = Date.now();

    if (cached && cachedTime && now - parseInt(cachedTime) < 1000 * 60 * 60) {
      console.log('Using cached products');
      return JSON.parse(cached) as Product[];
    }

    const productsData = await fetchProducts();
    localStorage.setItem('products', JSON.stringify(productsData));
    localStorage.setItem('products_cached_at', now.toString());
    return productsData;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const fetchSoldItems = async (): Promise<SoldItem[]> => {
  const response = await fetch('/api/sold_items');
  if (!response.ok) throw new Error('Failed to fetch sold items');
  return response.json();
};

export const fetchImages = async (): Promise<string[]> => imagesManifest.images;

export const createProducts = async (products: CreateProductInput[]): Promise<Product[]> => {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'Failed to create products');
  }

  localStorage.removeItem('products');
  localStorage.removeItem('products_cached_at');

  const data = (await response.json()) as { products: Product[] };
  return data.products;
};

export const createSale = async (saleData: CreateSaleInput): Promise<Sale> => {
  const response = await fetch('/api/registersale', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(saleData),
  });

  if (!response.ok) {
    throw new Error('Failed to create sale');
  }

  const data = (await response.json()) as { sale: Sale };
  return data.sale;
};

export const gql = async (query: string): Promise<unknown> => {
  const response = await fetch('./api/graph', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: query,
  });
  const data = (await response.json()) as { result: unknown };
  return data.result;
};
