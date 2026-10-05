import fs from 'fs';

const pandals = JSON.parse(fs.readFileSync('data/seed/pandals.json', 'utf8'));

let sql = `-- SQL Seed data for Pujofy (32 realistic Puja pandals across Kolkata with unique images)\n\n`;
sql += `TRUNCATE pandals, crowd_reports, users, trips, trip_events RESTART IDENTITY CASCADE;\n\n`;
sql += `INSERT INTO pandals (id, name, description, latitude, longitude, location, address, area, city, category, image_url, image_alt, estimated_visit_minutes, opening_time, closing_time, is_active) VALUES\n`;

const values = pandals.map((p) => {
  const desc = p.description.replace(/'/g, "''");
  const name = p.name.replace(/'/g, "''");
  const addr = p.address.replace(/'/g, "''");
  const area = (p.area || '').replace(/'/g, "''");
  const cat = (p.category || '').replace(/'/g, "''");
  const imgUrl = p.imageUrl;
  const imgAlt = p.imageAlt.replace(/'/g, "''");

  return `('${p.id}', '${name}', '${desc}', ${p.latitude}, ${p.longitude}, ST_SetSRID(ST_MakePoint(${p.longitude}, ${p.latitude}), 4326)::geography, '${addr}', '${area}', '${p.city}', '${cat}', '${imgUrl}', '${imgAlt}', ${p.estimatedVisitMinutes}, '${p.openingTime}', '${p.closingTime}', TRUE)`;
});

sql += values.join(',\n') + ';\n\n';

sql += `INSERT INTO crowd_reports (pandal_id, crowd_level, crowd_score, queue_minutes, confidence, source) VALUES\n`;
const crowdValues = pandals.map((p) => {
  const c = p.crowd || { crowdLevel: 'MEDIUM', crowdScore: 0.5, queueMinutes: 20, confidence: 0.85, source: 'USER' };
  return `('${p.id}', '${c.crowdLevel}', ${c.crowdScore}, ${c.queueMinutes}, ${c.confidence}, '${c.source}')`;
});
sql += crowdValues.join(',\n') + ';\n';

fs.writeFileSync('database/seeds/seed.sql', sql, 'utf8');
console.log('Successfully regenerated database/seeds/seed.sql with image_url and image_alt.');
