const pool = require('./db');

async function merge() {
  // Insert single fackverkstakstol family
  const result = await pool.query(`
    INSERT INTO product_families (kod, namn, beskrivning, takstol_typ)
    VALUES (
      'FACKVERKSTAKSTOL',
      'Fackverkstakstol',
      'Klassisk fackverk med diagonalstänger. Spännvidd 5.7–7.9m, lämplig för bostäder och industribyggnader.',
      'fackverkstakstol'
    )
    ON CONFLICT (kod) DO UPDATE SET namn = EXCLUDED.namn
    RETURNING id
  `);

  const newFamilyId = result.rows[0].id;

  // Point all products to the new family
  await pool.query(`
    UPDATE products SET family_id = $1
    WHERE family_id IN (
      SELECT id FROM product_families WHERE kod IN ('ES019IL', 'ES020IL')
    )
  `, [newFamilyId]);

  // Delete old families
  await pool.query(`DELETE FROM product_families WHERE kod IN ('ES019IL', 'ES020IL')`);

  console.log('Done — all products merged into FACKVERKSTAKSTOL');
  await pool.end();
}

merge().catch(console.error);