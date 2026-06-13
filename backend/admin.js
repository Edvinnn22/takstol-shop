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

function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.post('/verify', adminAuth, (req, res) => {
  res.json({ ok: true });
});

// Step 1: extract only — no DB write yet
router.post('/extract', adminAuth, upload.single('pdf'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file' });

  try {
    const pdfBuffer = fs.readFileSync(file.path);
    const base64 = pdfBuffer.toString('base64');

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
              source: { type: 'base64', media_type: 'application/pdf', data: base64 }
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
  "sakerhetsklass": "extract from SÄKERHETSKLASS field e.g. SK1, SK2, SK3",
  "klimatklass": "extract from KLIMATKLASS field e.g. 1, 2, 3",
  "materialbredd_mm": number,
  "takstol_typ": "one of: fackverkstakstol, saxtakstol, pulpettakstol, atakstol, ramverkstakstol, mansardtakstol, lantbrukstakstol, bagtakstol, specialtakstol — determine from the drawing type"
}`
            }
          ]
        }]
      })
    });

    const claudeData = await claudeRes.json();
    const text = claudeData.content[0].text.trim();
    const extracted = JSON.parse(text);

    // Store PDF temporarily on R2 with a staging key
    const stagingKey = `staging/${Date.now()}-${extracted.art_nr}.pdf`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: stagingKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    }));

    fs.unlinkSync(file.path);

    res.json({ extracted, stagingKey });

  } catch (err) {
    console.error(err);
    if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    res.status(500).json({ error: err.message });
  }
});

// Step 2: confirm + save to DB (with price)
router.post('/confirm', adminAuth, async (req, res) => {
  const { extracted, stagingKey, pris_kr } = req.body;

  try {
    // Move from staging to final key
    const { GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const finalKey = `pdfs/${extracted.art_nr}.pdf`;

    await s3.send(new CopyObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      CopySource: `${process.env.R2_BUCKET_NAME}/${stagingKey}`,
      Key: finalKey,
    }));

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: stagingKey,
    }));

    const pdfUrl = `${process.env.R2_PUBLIC_URL}/${finalKey}`;

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

    const productRes = await pool.query(`
      INSERT INTO products (
        family_id, art_nr, namn, spannvidd_mm, vikt_kg,
        takvinkel_grader, husvagg_mm, sidobislag_mm, lastbredd_max_mm,
        snolast_kn, vindlast_kn, sakerhetsklass, klimatklass, materialbredd_mm, pris_kr
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (art_nr) DO UPDATE SET
        namn = EXCLUDED.namn,
        spannvidd_mm = EXCLUDED.spannvidd_mm,
        vikt_kg = EXCLUDED.vikt_kg,
        takvinkel_grader = EXCLUDED.takvinkel_grader,
        pris_kr = EXCLUDED.pris_kr
      RETURNING id
    `, [
      familyId, extracted.art_nr, extracted.namn, extracted.spannvidd_mm,
      extracted.vikt_kg, extracted.takvinkel_grader, extracted.husvagg_mm,
      extracted.sidobislag_mm, extracted.lastbredd_max_mm, extracted.snolast_kn,
      extracted.vindlast_kn, extracted.sakerhetsklass, extracted.klimatklass,
      extracted.materialbredd_mm, pris_kr || null
    ]);

    const productId = productRes.rows[0].id;

    await pool.query(`
      INSERT INTO product_files (product_id, pdf_url)
      VALUES ($1, $2)
      ON CONFLICT (product_id) DO UPDATE SET pdf_url = EXCLUDED.pdf_url
    `, [productId, pdfUrl]);

    res.json({ success: true, product: extracted, pdf_url: pdfUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH price on existing product
router.patch('/product/:art_nr/price', adminAuth, async (req, res) => {
  try {
    const { pris_kr } = req.body;
    await pool.query(
      `UPDATE products SET pris_kr = $1 WHERE art_nr = $2`,
      [pris_kr, req.params.art_nr]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/product/:art_nr', adminAuth, async (req, res) => {
  try {
    const { art_nr } = req.params;
    const product = await pool.query(`SELECT id FROM products WHERE art_nr = $1`, [art_nr]);
    if (!product.rows.length) return res.status(404).json({ error: 'Not found' });

    const productId = product.rows[0].id;
    await pool.query(`DELETE FROM product_files WHERE product_id = $1`, [productId]);
    await pool.query(`DELETE FROM products WHERE id = $1`, [productId]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;