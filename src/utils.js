
// API-based data fetching functions
export const fetchSales = async () => {
  const response = await fetch('/api/sales');
  if (!response.ok) throw new Error('Failed to fetch sales');
  return (await response.json());
};

export const fetchProducts = async () => {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('Failed to fetch products');
  return (await response.json());
};

export const getProducts = async () => {
  try {
    const cached = localStorage.getItem('products');
    const cachedTime = localStorage.getItem('products_cached_at');
    const now = Date.now();

    if (cached && cachedTime && now - parseInt(cachedTime) < 1000 * 60 * 60) {
      console.log('Using cached products');
      return JSON.parse(cached);
    } else {
      const productsData = await fetchProducts();
      localStorage.setItem('products', JSON.stringify(productsData));
      localStorage.setItem('products_cached_at', now.toString());
      return productsData; 
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

export const fetchSoldItems = async () => {
  const response = await fetch('/api/sold_items');
  if (!response.ok) throw new Error('Failed to fetch sold items');
  return (await response.json());
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