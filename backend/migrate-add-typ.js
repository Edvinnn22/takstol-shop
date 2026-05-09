const pool = require('./db');

async function migrate() {
  await pool.query(`
    ALTER TABLE product_families 
    ADD COLUMN IF NOT EXISTS takstol_typ TEXT;
  `);
  console.log('Done');
  await pool.end();
}

migrate().catch(console.error);