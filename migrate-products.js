import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

// Last inn miljøvariabler
dotenv.config();

// Gamle databasen (kilde)
const oldHygraph = new GraphQLClient(
  'https://api-eu-central-1-shared-euc1-02.hygraph.com/v2/clxf60hv1019o07w8rgr6i90e/master',
  {
    headers: {
      Authorization: `Bearer ${process.env.HYGRAPH}`,
    },
  }
);

// Nye databasen (mål)
const newHygraph = new GraphQLClient(
  'https://eu-west-2.cdn.hygraph.com/content/cmd6ao2hz03540dw05hvtf513/master',
  {
    headers: {
      Authorization: `Bearer ${process.env.HYGRAPH_NEW}`,
    },
  }
);

// Query for å hente alle produkter fra gamle databasen
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

// Mutation for å opprette produkt i nye databasen
const CREATE_PRODUCT = `
  mutation CreateProduct($data: ProductCreateInput!) {
    createProduct(data: $data) {
      id
      name
      price
      slug
      category
    }
  }
`;

async function getAllProductsFromOldDB() {
  let allProducts = [];
  let skip = 0;
  let hasMore = true;
  const itemsPerPage = 100;
  
  console.log('🔍 Henter produkter fra gamle databasen...');
  
  while (hasMore) {
    try {
      const result = await oldHygraph.request(GET_ALL_PRODUCTS, {
        first: itemsPerPage,
        skip: skip,
      });
      
      allProducts = allProducts.concat(result.products);
      skip += itemsPerPage;
      console.log(`📦 Hentet ${result.products.length} produkter (total: ${allProducts.length})`);
      hasMore = result.products.length === itemsPerPage;
      
      // Kort pause for å ikke overbelaste API-et
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Feil ved henting fra gamle databasen:', error.message);
      throw error;
    }
  }
  
  return allProducts;
}

async function createProductInNewDB(product) {
  try {
    const result = await newHygraph.request(CREATE_PRODUCT, {
      data: {
        name: product.name,
        price: product.price,
        slug: product.slug,
        category: product.category,
      }
    });
    
    console.log(`✅ Opprettet: ${product.name}`);
    return result.createProduct;
  } catch (error) {
    console.error(`❌ Feil ved oppretting av ${product.name}:`, error.message);
    throw error;
  }
}

async function migrateProducts() {
  try {
    console.log('🚀 Starter migrering av produkter...\n');
    
    // Hent alle produkter fra gamle databasen
    const oldProducts = await getAllProductsFromOldDB();
    console.log(`\n📊 Totalt ${oldProducts.length} produkter funnet i gamle databasen\n`);
    
    if (oldProducts.length === 0) {
      console.log('⚠️  Ingen produkter funnet i gamle databasen');
      return;
    }
    
    // Opprett produkter i nye databasen
    console.log('🔄 Oppretter produkter i nye databasen...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of oldProducts) {
      try {
        await createProductInNewDB(product);
        successCount++;
        
        // Kort pause mellom hver oppretting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        errorCount++;
        console.log(`⚠️  Hoppet over ${product.name} på grunn av feil`);
      }
    }
    
    console.log('\n�� Migrering fullført!');
    console.log(`✅ Vellykket: ${successCount} produkter`);
    console.log(`❌ Feilet: ${errorCount} produkter`);
    console.log(`📊 Total: ${oldProducts.length} produkter behandlet`);
    
  } catch (error) {
    console.error('�� Kritisk feil under migrering:', error.message);
    process.exit(1);
  }
}

// Kjør migreringen
migrateProducts(); 