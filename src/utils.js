
// API-based data fetching functions
export const fetchProducts = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`/api/products?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  
  const data = await response.json();
  return data.products;
};

export const fetchProduct = async (slug) => {
  const response = await fetch(`/api/product?slug=${encodeURIComponent(slug)}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  
  const data = await response.json();
  return data.product;
};

export const fetchSales = async (params = {}) => {
  const queryParams = new URLSearchParams(params);
  const response = await fetch(`/api/sales?${queryParams}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch sales');
  }
  
  const data = await response.json();
  return data.sales;
};

export const createSale = async (saleData) => {
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
  
  const data = await response.json();
  return data.sale;
};

// Legacy GraphQL functions (for backward compatibility during migration)
export const gql = async (query) => {
  const response = await fetch(`./api/graph`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: query,
  })
  const data = await response.json();
  return data.result;
}

// Note: The hygraphClient function is removed since it's not needed in the browser
// and was causing the dotenv issue. The gql function above handles GraphQL requests
// through the API endpoint instead.