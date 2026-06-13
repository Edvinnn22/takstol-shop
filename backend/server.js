const express = require('express');
const path = require('path');
const pool = require('./db');
const { Resend } = require('resend');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  dest: 'tmp/',
  limits: { fileSize: 20 * 1024 * 1024 }
});

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

// Contact / quote form with file upload
app.post('/api/contact', upload.array('filer', 10), async (req, res) => {
  const { namn, epost, telefon, beskrivning } = req.body;
  const files = req.files || [];

  try {
    const fileLinks = [];
    for (const file of files) {
      const key = `inquiries/${Date.now()}-${file.originalname}`;
      const fileBuffer = fs.readFileSync(file.path);

      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
      }));

      fs.unlinkSync(file.path);
      fileLinks.push(`${process.env.R2_PUBLIC_URL}/${key}`);
    }

    const filesHtml = fileLinks.length
      ? `<p><strong>Bifogade filer:</strong></p><ul>${fileLinks.map(l => `<li><a href="${l}">${l}</a></li>`).join('')}</ul>`
      : '<p><strong>Bifogade filer:</strong> Inga</p>';

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.NOTIFY_EMAIL,
      subject: `Ny förfrågan från ${namn}`,
      html: `
        <h2>Ny projektförfrågan</h2>
        <p><strong>Namn:</strong> ${namn}</p>
        <p><strong>E-post:</strong> ${epost}</p>
        <p><strong>Telefon:</strong> ${telefon || '—'}</p>
        <p><strong>Beskrivning:</strong><br>${beskrivning || '—'}</p>
        ${filesHtml}
      `
    });

    res.json({ ok: true });
  } catch (err) {
    for (const file of files) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Filen är för stor (max 20 MB)' });
    }
    console.error(err);
    res.status(500).json({ error: 'Kunde inte skicka e-post' });
  }
});

// Offert form (product quote request)
app.post('/api/offert', async (req, res) => {
  const { company, email, phone, project, message, product } = req.body;

  const productHtml = product ? `
    <hr>
    <h3>Produkt</h3>
    <p><strong>Art.nr:</strong> ${product.art_nr}</p>
    <p><strong>Spännvidd:</strong> ${product.spannvidd_mm} mm</p>
    <p><strong>Takvinkel:</strong> ${product.takvinkel_grader}°</p>
    <p><strong>Vikt:</strong> ${product.vikt_kg} kg</p>
    ${product.sakerhetsklass ? `<p><strong>Säkerhetsklass:</strong> ${product.sakerhetsklass}</p>` : ''}
    ${product.snolast_kn_m2 ? `<p><strong>Snölast:</strong> ${product.snolast_kn_m2} kN/m²</p>` : ''}
  ` : '';

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.NOTIFY_EMAIL,
      replyTo: email,
      subject: `Offertförfrågan – ${product?.art_nr || 'Okänd produkt'}`,
      html: `
        <h2>Ny offertförfrågan</h2>
        <p><strong>Företag/Namn:</strong> ${company}</p>
        <p><strong>E-post:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone || '—'}</p>
        <p><strong>Projekt:</strong> ${project || '—'}</p>
        <p><strong>Meddelande:</strong><br>${message || '—'}</p>
        ${productHtml}
      `
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunde inte skicka e-post' });
  }
});

app.get('/', (req, res) => {
  res.send('Server is running on localhost:3000!');
});

app.listen(PORT, () => {
  console.log(`Server is successfully running on http://localhost:${PORT}`);
});