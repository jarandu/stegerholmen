import { createClient } from '@supabase/supabase-js';
import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Hygraph client for source data
const hygraphClient = new GraphQLClient(
  'https://eu-west-2.cdn.hygraph.com/content/cmd6ao2hz03540dw05hvtf513/master',
  {
    headers: {
      Authorization: `Bearer ${process.env.HYGRAPH_25}`,
    },
  }
);

// Simplified GraphQL query to match your actual schema
const GET_ALL_PRODUCTS = `
  query GetAllProducts($first: Int!, $skip: Int!) {
    products(orderBy: name_ASC, first: $first, skip: $skip) {
      id
      name
      price
      slug
      category
    }
  }
`;

// Simplified GraphQL query for sales
const GET_ALL_SALES = `
  query GetAllSales($first: Int!, $skip: Int!) {
    sales(orderBy: time_DESC, first: $first, skip: $skip) {
      id
      sum
      paymentMethod
      time
      fullfilled
      text
      soldItems {
        id
        price
        product {
          id
          name
          category
        }
      }
    }
  }
`;

async function checkTablesExist() {
  try {
    console.log(' Checking if tables exist...');
    
    // Try to query each table to see if they exist
    const { error: productsError } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });
    
    const { error: salesError } = await supabase
      .from('sales')
      .select('count', { count: 'exact', head: true });
    
    const { error: soldItemsError } = await supabase
      .from('sold_items')
      .select('count', { count: 'exact', head: true });
    
    if (productsError || salesError || soldItemsError) {
      console.log('❌ Some tables are missing. Please create them manually in Supabase dashboard.');
      console.log('\n📋 SQL to create tables:');
      console.log(`
-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hygraph_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_hygraph_id ON products(hygraph_id);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hygraph_id VARCHAR(255) UNIQUE,
  sum DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  fullfilled BOOLEAN DEFAULT true,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sales
CREATE INDEX IF NOT EXISTS idx_sales_time ON sales(time);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_hygraph_id ON sales(hygraph_id);

-- Create sold_items table
CREATE TABLE IF NOT EXISTS sold_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hygraph_id VARCHAR(255) UNIQUE,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for sold_items
CREATE INDEX IF NOT EXISTS idx_sold_items_sale_id ON sold_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sold_items_product_id ON sold_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sold_items_hygraph_id ON sold_items(hygraph_id);
      `);
      
      throw new Error('Tables need to be created manually');
    }
    
    console.log('✅ All tables exist and are accessible');
    return true;
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    throw error;
  }
}

async function getAllProductsFromHygraph() {
  let allProducts = [];
  let skip = 0;
  let hasMore = true;
  const itemsPerPage = 100;
  
  console.log('🔍 Fetching products from Hygraph...');
  
  while (hasMore) {
    try {
      const result = await hygraphClient.request(GET_ALL_PRODUCTS, {
        first: itemsPerPage,
        skip: skip,
      });
      
      allProducts = allProducts.concat(result.products);
      skip += itemsPerPage;
      console.log(`📦 Fetched ${result.products.length} products (total: ${allProducts.length})`);
      hasMore = result.products.length === itemsPerPage;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Error fetching from Hygraph:', error.message);
      console.error('Full error:', error);
      throw error;
    }
  }
  
  return allProducts;
}

async function getAllSalesFromHygraph() {
  let allSales = [];
  let skip = 0;
  let hasMore = true;
  const itemsPerPage = 100;
  
  console.log('🔍 Fetching sales from Hygraph...');
  
  while (hasMore) {
    try {
      const result = await hygraphClient.request(GET_ALL_SALES, {
        first: itemsPerPage,
        skip: skip,
      });
      
      allSales = allSales.concat(result.sales);
      skip += itemsPerPage;
      console.log(` Fetched ${result.sales.length} sales (total: ${allSales.length})`);
      hasMore = result.sales.length === itemsPerPage;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Error fetching from Hygraph:', error.message);
      console.error('Full error:', error);
      throw error;
    }
  }
  
  return allSales;
}

async function insertProduct(product) {
  try {
    const { data, error } = await supabase
      .from('products')
      .upsert({
        hygraph_id: product.id,
        name: product.name,
        price: product.price,
        slug: product.slug,
        category: product.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'hygraph_id'
      });
    
    if (error) {
      console.error(`❌ Error inserting ${product.name}:`, error.message);
      throw error;
    }
    
    console.log(`✅ Inserted/Updated: ${product.name}`);
    return data[0];
  } catch (error) {
    console.error(`❌ Error inserting ${product.name}:`, error.message);
    throw error;
  }
}

async function insertSale(sale) {
  try {
    // Insert the sale
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .upsert({
        hygraph_id: sale.id,
        sum: sale.sum,
        payment_method: sale.paymentMethod,
        time: sale.time,
        fullfilled: sale.fullfilled !== false,
        text: sale.text || null,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'hygraph_id'
      })
      .select();
    
    if (saleError) {
      console.error(`❌ Error inserting sale ${sale.id}:`, saleError.message);
      throw saleError;
    }
    
    const insertedSale = saleData[0];
    
    // Insert sold items
    for (const soldItem of sale.soldItems) {
      // Get the product ID from our database using hygraph_id
      const { data: productData } = await supabase
        .from('products')
        .select('id')
        .eq('hygraph_id', soldItem.product?.id)
        .single();
      
      const { error: soldItemError } = await supabase
        .from('sold_items')
        .upsert({
          hygraph_id: soldItem.id,
          sale_id: insertedSale.id,
          product_id: productData?.id || null,
          price: soldItem.price,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'hygraph_id'
        });
      
      if (soldItemError) {
        console.error(`❌ Error inserting sold item ${soldItem.id}:`, soldItemError.message);
      }
    }
    
    console.log(`✅ Inserted/Updated sale: ${sale.id}`);
    return insertedSale;
  } catch (error) {
    console.error(`❌ Error inserting sale ${sale.id}:`, error.message);
    throw error;
  }
}

async function migrateToSupabase() {
  try {
    console.log(' Starting migration to Supabase...\n');
    
    // Check if tables exist
    await checkTablesExist();
    
    // Migrate products
    console.log('\n Migrating products...');
    const products = await getAllProductsFromHygraph();
    console.log(`📊 Total ${products.length} products found in Hygraph\n`);
    
    if (products.length > 0) {
      let successCount = 0;
      let errorCount = 0;
      
      for (const product of products) {
        try {
          await insertProduct(product);
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          errorCount++;
          console.log(`⚠️  Skipped ${product.name} due to error`);
        }
      }
      
      console.log(`\n✅ Products migration completed!`);
      console.log(`✅ Successful: ${successCount} products`);
      console.log(`❌ Failed: ${errorCount} products`);
    }
    
    // Migrate sales
    console.log('\n Migrating sales...');
    const sales = await getAllSalesFromHygraph();
    console.log(`📊 Total ${sales.length} sales found in Hygraph\n`);
    
    if (sales.length > 0) {
      let successCount = 0;
      let errorCount = 0;
      
      for (const sale of sales) {
        try {
          await insertSale(sale);
          successCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          errorCount++;
          console.log(`⚠️  Skipped sale ${sale.id} due to error`);
        }
      }
      
      console.log(`\n✅ Sales migration completed!`);
      console.log(`✅ Successful: ${successCount} sales`);
      console.log(`❌ Failed: ${errorCount} sales`);
    }
    
    console.log('\n🎉 Migration to Supabase completed successfully!');
    
  } catch (error) {
    console.error('💥 Critical error during migration:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateToSupabase(); 