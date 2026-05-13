// seed-families.js
require('dotenv').config({ path: __dirname + '/.env' });
const pool = require('./db');

async function seed() {
  await pool.query(`
    INSERT INTO product_families (kod, namn, beskrivning, takstol_typ) VALUES
      ('SAXTAKSTOL',      'Saxtakstol',      'När du vill ha öppet upp till nock.',        'saxtakstol'),
      ('PULPETTAKSTOL',   'Pulpettakstol',   'För takfall åt ett håll.',                   'pulpettakstol'),
      ('A-TAKSTOL',        'A-takstol',       'När du behöver extra högt i tak.',           'a-takstol'),
      ('RAMVERKSTAKSTOL', 'Ramverkstakstol', 'För en extra våning eller förråd.',          'ramverkstakstol'),
      ('MANSARDTAKSTOL',  'Mansardtakstol',  'När du vill ha brutet tak.',                 'mansardtakstol'),
      ('LANTBRUKSTAKSTOL','Lantbrukstakstol','För långa spännvidder.',                     'lantbrukstakstol'),
      ('BAGTAKSTOL',      'Bågtakstol',      'För ett annorlunda tak.',                    'bagtakstol'),
      ('SPECIALTAKSTOL',  'Specialtakstol',  'När en annorlunda lösning krävs.',           'specialtakstol')
    ON CONFLICT (kod) DO NOTHING;
  `);
  console.log('Done');
  await pool.end();
}

seed().catch(console.error);