const pool = require('./db');

async function seed() {
  // Families
  const es019 = await pool.query(`
    INSERT INTO product_families (kod, namn, beskrivning)
    VALUES ('ES019IL', 'ES019IL — Fackverkstakstol', 'Takfot inklädd lång 950mm, spännvidd ~5.8–6.5m')
    ON CONFLICT (kod) DO UPDATE SET namn = EXCLUDED.namn
    RETURNING id
  `);

  const es020 = await pool.query(`
    INSERT INTO product_families (kod, namn, beskrivning)
    VALUES ('ES020IL', 'ES020IL — Fackverkstakstol', 'Takfot inklädd lång 950mm, spännvidd ~6.5–7.9m')
    ON CONFLICT (kod) DO UPDATE SET namn = EXCLUDED.namn
    RETURNING id
  `);

  const es019id = es019.rows[0].id;
  const es020id = es020.rows[0].id;

  const products = [
    {
      family_id: es019id,
      art_nr: 'ES019IL-2',
      namn: 'Takfot inklädd lång 950mm — 2 kapade tassar 687',
      spannvidd_mm: 5926,
      vikt_kg: 50,
      takvinkel_grader: 18,
      husvagg_mm: 250,
      sidobislag_mm: 120,
      lastbredd_max_mm: 1200,
      snolast_kn: 2.5,
      vindlast_kn: 0.85,
      sakerhetsklass: 'SK2',
      klimatklass: '2',
      materialbredd_mm: 45,
    },
    {
      family_id: es019id,
      art_nr: 'ES019IL-3',
      namn: 'Takfot inklädd lång 950mm — 3 kapade tassar 687+761',
      spannvidd_mm: 5852,
      vikt_kg: 50,
      takvinkel_grader: 18,
      husvagg_mm: 250,
      sidobislag_mm: null,
      lastbredd_max_mm: 1200,
      snolast_kn: 2.5,
      vindlast_kn: 0.85,
      sakerhetsklass: 'SK2',
      klimatklass: '2',
      materialbredd_mm: 45,
    },
    {
      family_id: es019id,
      art_nr: 'ES019IL-4',
      namn: 'Takfot inklädd lång 950mm — 4 kapad tass 761',
      spannvidd_mm: 6539,
      vikt_kg: 52,
      takvinkel_grader: 18,
      husvagg_mm: 250,
      sidobislag_mm: null,
      lastbredd_max_mm: 1200,
      snolast_kn: 2.5,
      vindlast_kn: 0.85,
      sakerhetsklass: 'SK2',
      klimatklass: '2',
      materialbredd_mm: 45,
    },
    {
      family_id: es019id,
      art_nr: 'ES019IL-5',
      namn: 'Takfot inklädd lång 950mm — 5 kapade tassar 761',
      spannvidd_mm: 5778,
      vikt_kg: 50,
      takvinkel_grader: 18,
      husvagg_mm: 250,
      sidobislag_mm: null,
      lastbredd_max_mm: 1200,
      snolast_kn: 2.5,
      vindlast_kn: 0.85,
      sakerhetsklass: 'SK2',
      klimatklass: '2',
      materialbredd_mm: 45,
    },
    {
      family_id: es020id,
      art_nr: 'ES020IL',
      namn: 'Takfot inklädd lång 950mm',
      spannvidd_mm: 7900,
      vikt_kg: 61,
      takvinkel_grader: 18,
      husvagg_mm: 250,
      sidobislag_mm: 120,
      lastbredd_max_mm: 1200,
      snolast_kn: 2.5,
      vindlast_kn: 0.85,
      sakerhetsklass: 'SK2',
      klimatklass: '2',
      materialbredd_mm: 45,
    },
    {
      family_id: es020id,
      art_nr: 'ES020IL-1',
      namn: 'Takfot inklädd lång 950mm — 1 kapad tass 687',
      spannvidd_mm: 7213,
      vikt_kg: 59,
      takvinkel_grader: 18,
      husvagg_mm: 250,
      sidobislag_mm: 120,
      lastbredd_max_mm: 1200,
      snolast_kn: 2.5,
      vindlast_kn: 0.85,
      sakerhetsklass: 'SK2',
      klimatklass: '2',
      materialbredd_mm: 45,
    },
    {
      family_id: es020id,
      art_nr: 'ES020IL-2',
      namn: 'Takfot inklädd lång 950mm — 2 kapade tassar 687',
      spannvidd_mm: 6526,
      vikt_kg: 57,
      takvinkel_grader: 18,
      husvagg_mm: 250,
      sidobislag_mm: 120,
      lastbredd_max_mm: 1200,
      snolast_kn: 2.5,
      vindlast_kn: 0.85,
      sakerhetsklass: 'SK2',
      klimatklass: '2',
      materialbredd_mm: 45,
    },
  ];

  for (const p of products) {
    await pool.query(`
      INSERT INTO products (
        family_id, art_nr, namn, spannvidd_mm, vikt_kg,
        takvinkel_grader, husvagg_mm, sidobislag_mm, lastbredd_max_mm,
        snolast_kn, vindlast_kn, sakerhetsklass, klimatklass, materialbredd_mm
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )
      ON CONFLICT (art_nr) DO NOTHING
    `, [
      p.family_id, p.art_nr, p.namn, p.spannvidd_mm, p.vikt_kg,
      p.takvinkel_grader, p.husvagg_mm, p.sidobislag_mm, p.lastbredd_max_mm,
      p.snolast_kn, p.vindlast_kn, p.sakerhetsklass, p.klimatklass, p.materialbredd_mm
    ]);
    console.log(`Inserted: ${p.art_nr}`);
  }

  console.log('Seed done');
  await pool.end();
}

seed().catch(console.error);