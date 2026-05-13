const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const pool = require('./db');

const upload = multer({ dest: 'tmp/' });

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Password middleware
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Upload + extract + insert
router.post('/upload', adminAuth, upload.single('pdf'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file' });

  try {
    // Read PDF as base64
    const pdfBuffer = fs.readFileSync(file.path);
    const base64 = pdfBuffer.toString('base64');

    // Send to Claude API for extraction
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              }
            },
            {
              type: 'text',
              text: `Extract the following fields from this MiTek Pamir takstol ritning and return ONLY a JSON object, no markdown, no preamble:
{
  "art_nr": "e.g. ES019IL-2",
  "namn": "full name from ART NR line",
  "spannvidd_mm": number,
  "vikt_kg": number,
  "takvinkel_grader": number,
  "husvagg_mm": number,
  "sidobislag_mm": number or null,
  "lastbredd_max_mm": number,
  "snolast_kn": number,
  "vindlast_kn": number,
  "sakerhetsklass": "SK2",
  "klimatklass": "2",
  "materialbredd_mm": number,
  "takstol_typ": "fackverkstakstol"
}`
            }
          ]
        }]
      })
    });

    const claudeData = await claudeRes.json();
    const text = claudeData.content[0].text.trim();
    const extracted = JSON.parse(text);

    // Upload PDF to R2
    const filename = `${extracted.art_nr}.pdf`;
    const key = `pdfs/${filename}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    }));
    const pdfUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // Find or create family
    let familyRes = await pool.query(
      `SELECT id FROM product_families WHERE takstol_typ = $1`,
      [extracted.takstol_typ]
    );

    let familyId;
    if (familyRes.rows.length) {
      familyId = familyRes.rows[0].id;
    } else {
      const newFamily = await pool.query(
        `INSERT INTO product_families (kod, namn, beskrivning, takstol_typ)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          extracted.takstol_typ.toUpperCase(),
          extracted.takstol_typ.charAt(0).toUpperCase() + extracted.takstol_typ.slice(1),
          extracted.namn,
          extracted.takstol_typ
        ]
      );
      familyId = newFamily.rows[0].id;
    }

    // Upsert product
    const productRes = await pool.query(`
      INSERT INTO products (
        family_id, art_nr, namn, spannvidd_mm, vikt_kg,
        takvinkel_grader, husvagg_mm, sidobislag_mm, lastbredd_max_mm,
        snolast_kn, vindlast_kn, sakerhetsklass, klimatklass, materialbredd_mm
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      ON CONFLICT (art_nr) DO UPDATE SET
        namn = EXCLUDED.namn,
        spannvidd_mm = EXCLUDED.spannvidd_mm,
        vikt_kg = EXCLUDED.vikt_kg,
        takvinkel_grader = EXCLUDED.takvinkel_grader
      RETURNING id
    `, [
      familyId, extracted.art_nr, extracted.namn, extracted.spannvidd_mm,
      extracted.vikt_kg, extracted.takvinkel_grader, extracted.husvagg_mm,
      extracted.sidobislag_mm, extracted.lastbredd_max_mm, extracted.snolast_kn,
      extracted.vindlast_kn, extracted.sakerhetsklass, extracted.klimatklass,
      extracted.materialbredd_mm
    ]);

    const productId = productRes.rows[0].id;

    // Upsert product_files
    await pool.query(`
      INSERT INTO product_files (product_id, pdf_url)
      VALUES ($1, $2)
      ON CONFLICT (product_id) DO UPDATE SET pdf_url = EXCLUDED.pdf_url
    `, [productId, pdfUrl]);

    // Cleanup tmp file
    fs.unlinkSync(file.path);

    res.json({ success: true, product: extracted, pdf_url: pdfUrl });

  } catch (err) {
    console.error(err);
    if (file?.path) fs.unlinkSync(file.path);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;