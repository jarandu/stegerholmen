import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

const hygraphClient = new GraphQLClient(
  'https://eu-west-2.cdn.hygraph.com/content/cmd6ao2hz03540dw05hvtf513/master',
  {
    headers: {
      Authorization: `Bearer ${process.env.HYGRAPH_25}`,
    },
  }
);

const TEST_PRODUCTS_QUERY = `
  query TestProducts {
    products(first: 5) {
      id
      name
      price
      slug
      category
    }
  }
`;

const TEST_SALES_QUERY = `
  query TestSales {
    sales(first: 5) {
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

async function testHygraph() {
  try {
    console.log('🧪 Testing Hygraph connection...\n');
    
    // Test products
    console.log('📦 Testing products query...');
    const productsResult = await hygraphClient.request(TEST_PRODUCTS_QUERY);
    console.log('✅ Products query successful');
    console.log('Sample products:', JSON.stringify(productsResult.products, null, 2));
    
    // Test sales
    console.log('\n💰 Testing sales query...');
    const salesResult = await hygraphClient.request(TEST_SALES_QUERY);
    console.log('✅ Sales query successful');
    console.log('Sample sales:', JSON.stringify(salesResult.sales, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testHygraph();