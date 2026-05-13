// check-families.js
require('dotenv').config({ path: __dirname + '/.env' });
const pool = require('./db');

async function check() {
  const res = await pool.query(`SELECT kod, namn, takstol_typ FROM product_families ORDER BY id`);
  console.table(res.rows);
  await pool.end();
}

check().catch(console.error);