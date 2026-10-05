import fs from 'fs';

const seedPath = 'data/seed/pandals.json';
const pandals = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

const updated = pandals.map((p, idx) => {
  const num = String(idx + 1).padStart(3, '0');
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    latitude: p.latitude,
    longitude: p.longitude,
    imageUrl: `/images/pandals/pandal-${num}.webp`,
    imageAlt: `Festive Durga Puja pandal at ${p.name} - ${p.category || 'Theme Art'}`,
    address: p.address,
    area: p.area,
    city: p.city,
    category: p.category,
    estimatedVisitMinutes: p.estimatedVisitMinutes,
    openingTime: p.openingTime,
    closingTime: p.closingTime,
    isActive: p.isActive,
    crowd: p.crowd,
  };
});

fs.writeFileSync(seedPath, JSON.stringify(updated, null, 2), 'utf8');
console.log('Successfully updated data/seed/pandals.json with 32 unique images and alt texts.');
