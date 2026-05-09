const pool = require('./db');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_families (
      id SERIAL PRIMARY KEY,
      kod TEXT UNIQUE NOT NULL,
      namn TEXT NOT NULL,
      beskrivning TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      family_id INTEGER REFERENCES product_families(id),
      art_nr TEXT UNIQUE NOT NULL,
      namn TEXT NOT NULL,
      spannvidd_mm INTEGER,
      vikt_kg INTEGER,
      takvinkel_grader INTEGER,
      husvagg_mm INTEGER,
      sidobislag_mm INTEGER,
      lastbredd_max_mm INTEGER,
      snolast_kn NUMERIC,
      vindlast_kn NUMERIC,
      sakerhetsklass TEXT,
      klimatklass TEXT,
      materialbredd_mm INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS product_files (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id),
      pdf_url TEXT,
      image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('Migration done');
  await pool.end();
}

migrate().catch(console.error);