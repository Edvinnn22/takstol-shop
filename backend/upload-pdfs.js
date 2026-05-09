const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const pool = require('./db');
require('dotenv').config();

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Map art_nr to local PDF filename
const pdfMap = {
  'ES019IL-2': 'ES019IL-2.pdf',
  'ES019IL-3': 'ES019IL-3.pdf',
  'ES019IL-4': 'ES019IL-4.pdf',
  'ES019IL-5': 'ES019IL-5.pdf',
  'ES020IL':   'ES020IL.pdf',
  'ES020IL-1': 'ES020IL-1.pdf',
  'ES020IL-2': 'ES020IL-2.pdf',
};

// Folder where your PDFs are stored locally
const PDF_DIR = path.join(__dirname, 'pdfs');

async function uploadPdfs() {
  for (const [artNr, filename] of Object.entries(pdfMap)) {
    const filePath = path.join(PDF_DIR, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`Skipping ${filename} — not found`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const key = `pdfs/${filename}`;

    // Upload to R2
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
    }));

    const pdfUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    console.log(`Uploaded: ${filename} → ${pdfUrl}`);

    // Get product id
    const product = await pool.query(`SELECT id FROM products WHERE art_nr = $1`, [artNr]);
    if (!product.rows.length) {
      console.log(`No product found for ${artNr}`);
      continue;
    }

    const productId = product.rows[0].id;

    // Upsert into product_files
    await pool.query(`
      INSERT INTO product_files (product_id, pdf_url)
      VALUES ($1, $2)
      ON CONFLICT (product_id) DO UPDATE SET pdf_url = EXCLUDED.pdf_url
    `, [productId, pdfUrl]);

    console.log(`DB updated for ${artNr}`);
  }

  console.log('All done');
  await pool.end();
}

uploadPdfs().catch(console.error);