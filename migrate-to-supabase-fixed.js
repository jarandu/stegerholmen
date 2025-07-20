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

// GraphQL queries matching your actual schema
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

async function clearExistingData() {
  try {
    console.log('🧹 Clearing existing data...');
    
    // Delete in correct order due to foreign key constraints
    const { error: soldItemsError } = await supabase
      .from('sold_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (soldItemsError) {
      console.error('Error clearing sold_items:', soldItemsError);
    }
    
    const { error: salesError } = await supabase
      .from('sales')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (salesError) {
      console.error('Error clearing sales:', salesError);
    }
    
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (productsError) {
      console.error('Error clearing products:', productsError);
    }
    
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
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
      console.log(`�� Fetched ${result.sales.length} sales (total: ${allSales.length})`);
      hasMore = result.sales.length === itemsPerPage;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Error fetching from Hygraph:', error.message);
      throw error;
    }
  }
  
  return allSales;
}

async function insertProduct(product) {
  try {
    // Validate required fields
    if (!product.name || product.price === undefined || !product.slug) {
      console.log(`⚠️  Skipping product with missing required fields: ${product.name || 'Unknown'}`);
      return null;
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        hygraph_id: product.id,
        name: product.name,
        price: parseFloat(product.price) || 0,
        slug: product.slug,
        category: product.category || 'Unknown',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Error inserting ${product.name}:`, error.message);
      return null;
    }
    
    console.log(`✅ Inserted: ${product.name}`);
    return data;
  } catch (error) {
    console.error(`❌ Error inserting ${product.name}:`, error.message);
    return null;
  }
}

async function insertSale(sale) {
  try {
    // Validate required fields
    if (!sale.sum || !sale.paymentMethod || !sale.time) {
      console.log(`⚠️  Skipping sale with missing required fields: ${sale.id}`);
      return null;
    }

    // Insert the sale
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        hygraph_id: sale.id,
        sum: parseFloat(sale.sum) || 0,
        payment_method: sale.paymentMethod,
        time: sale.time,
        fullfilled: sale.fullfilled !== false,
        text: sale.text || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (saleError) {
      console.error(`❌ Error inserting sale ${sale.id}:`, saleError.message);
      return null;
    }
    
    const insertedSale = saleData;
    
    // Insert sold items
    if (sale.soldItems && sale.soldItems.length > 0) {
      for (const soldItem of sale.soldItems) {
        try {
          // Get the product ID from our database using hygraph_id
          let productId = null;
          if (soldItem.product?.id) {
            const { data: productData } = await supabase
              .from('products')
              .select('id')
              .eq('hygraph_id', soldItem.product.id)
              .single();
            productId = productData?.id;
          }
          
          const { error: soldItemError } = await supabase
            .from('sold_items')
            .insert({
              hygraph_id: soldItem.id,
              sale_id: insertedSale.id,
              product_id: productId,
              price: parseFloat(soldItem.price) || 0,
              created_at: new Date().toISOString()
            });
          
          if (soldItemError) {
            console.error(`❌ Error inserting sold item ${soldItem.id}:`, soldItemError.message);
          }
        } catch (error) {
          console.error(`❌ Error processing sold item ${soldItem.id}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Inserted sale: ${sale.id}`);
    return insertedSale;
  } catch (error) {
    console.error(`❌ Error inserting sale ${sale.id}:`, error.message);
    return null;
  }
}

async function migrateToSupabase() {
  try {
    console.log('🚀 Starting fresh migration to Supabase...\n');
    
    // Clear existing data to avoid conflicts
    await clearExistingData();
    
    // Migrate products first
    console.log('\n�� Migrating products...');
    const products = await getAllProductsFromHygraph();
    console.log(`📊 Total ${products.length} products found in Hygraph\n`);
    
    if (products.length > 0) {
      let successCount = 0;
      let errorCount = 0;
      
      for (const product of products) {
        const result = await insertProduct(product);
        if (result) {
          successCount++;
        } else {
          errorCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`\n✅ Products migration completed!`);
      console.log(`✅ Successful: ${successCount} products`);
      console.log(`❌ Failed: ${errorCount} products`);
    }
    
    // Migrate sales after products are done
    console.log('\n�� Migrating sales...');
    const sales = await getAllSalesFromHygraph();
    console.log(`📊 Total ${sales.length} sales found in Hygraph\n`);
    
    if (sales.length > 0) {
      let successCount = 0;
      let errorCount = 0;
      
      for (const sale of sales) {
        const result = await insertSale(sale);
        if (result) {
          successCount++;
        } else {
          errorCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
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