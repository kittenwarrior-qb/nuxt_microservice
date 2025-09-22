#!/usr/bin/env node

const { Client } = require('@elastic/elasticsearch');
const sequelize = require('../config/database');

async function importToElasticsearch() {
  console.log('🚀 Starting Elasticsearch import...');
  
  try {
    // Connect to ES
    const es = new Client({ 
      node: process.env.ELASTICSEARCH_NODE || 'http://elasticsearch:9200' 
    });
    
    // Wait for ES to be ready
    console.log('⏳ Waiting for Elasticsearch...');
    for (let i = 0; i < 30; i++) {
      try {
        await es.ping();
        break;
      } catch (err) {
        if (i === 29) throw new Error('ES not available');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('✅ Elasticsearch connected');
    
    // Get products from PostgreSQL
    const [products] = await sequelize.query(`
      SELECT id, name, price, brand, category, img, created_at
      FROM products 
      WHERE name IS NOT NULL AND TRIM(name) != ''
      ORDER BY created_at DESC
      LIMIT 5000
    `);
    
    console.log(`📊 Found ${products.length} products to import`);
    
    if (products.length === 0) {
      console.log('⚠️ No products found in database');
      return;
    }
    
    // Bulk import to ES
    const body = [];
    products.forEach(product => {
      body.push({ index: { _index: 'products', _id: product.id } });
      body.push({
        id: product.id,
        name: product.name,
        price: product.price,
        brand: product.brand,
        category: product.category,
        img: product.img,
        created_at: product.created_at
      });
    });
    
    console.log('📤 Importing to Elasticsearch...');
    const result = await es.bulk({ refresh: true, body });
    
    if (result.errors) {
      console.error('❌ Some imports failed');
    } else {
      console.log(`✅ Successfully imported ${products.length} products!`);
    }
    
    // Verify count
    const count = await es.count({ index: 'products' });
    console.log(`📈 Total documents in ES: ${count.count}`);
    
    // Test search
    const searchResult = await es.search({
      index: 'products',
      size: 3,
      query: { multi_match: { query: 'iphone', fields: ['name^3', 'brand^2'] } }
    });
    
    console.log(`🔍 Test search returned ${searchResult.hits.hits.length} results`);
    console.log('🎉 Elasticsearch import completed successfully!');
    
  } catch (error) {
    console.error('💥 Import failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  importToElasticsearch()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { importToElasticsearch };
