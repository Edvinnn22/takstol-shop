const pool = require('./db');

async function update() {
  await pool.query(`UPDATE product_families SET takstol_typ = 'fackverkstakstol' WHERE kod IN ('ES019IL', 'ES020IL')`);
  console.log('Done');
  await pool.end();
}

update().catch(console.error);