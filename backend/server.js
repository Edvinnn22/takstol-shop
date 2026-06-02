const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = 3000;

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const adminRouter = require('./admin');
app.use('/admin/api', adminRouter);

app.use(express.static(path.join(__dirname, '../frontend')));

// Products API route
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        pf.pdf_url,
        pf.image_url
      FROM products p
      LEFT JOIN product_files pf ON pf.product_id = p.id
      ORDER BY p.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// All families (category listing page)
app.get('/api/families', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM product_families ORDER BY id ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// All products in a family (variant listing page)
app.get('/api/families/:kod/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, pf.pdf_url, pf.image_url
      FROM products p
      LEFT JOIN product_files pf ON pf.product_id = p.id
      JOIN product_families f ON f.id = p.family_id
      WHERE f.kod = $1
      ORDER BY p.spannvidd_mm ASC
    `, [req.params.kod]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});






app.get('/', (req, res) => {
  res.send('Server is running on localhost:3000!');
});

app.listen(PORT, () => {
  console.log(`Server is successfully running on http://localhost:${PORT}`);
});