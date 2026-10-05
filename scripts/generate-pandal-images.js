import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const outputDir = 'apps/web/public/images/pandals';
fs.mkdirSync(outputDir, { recursive: true });

const pandals = JSON.parse(fs.readFileSync('data/seed/pandals.json', 'utf8'));

// Palette themes for festive variety
const PALETTES = [
  { bg1: '#3A1414', bg2: '#1F0A0A', accent: '#FFD166', text: '#FFFDF9', glow: '#C59A62', motif: 'mandala' },
  { bg1: '#241734', bg2: '#120B1C', accent: '#E8B4B8', text: '#FAF7F2', glow: '#B87352', motif: 'temple' },
  { bg1: '#1B2A4A', bg2: '#0D1527', accent: '#F4D06F', text: '#FFFDF9', glow: '#E0A96D', motif: 'stars' },
  { bg1: '#2E1C14', bg2: '#170D08', accent: '#E39774', text: '#FFFDF9', glow: '#C59A62', motif: 'diya' },
  { bg1: '#132E24', bg2: '#081712', accent: '#D4AF37', text: '#FAF7F2', glow: '#B8860B', motif: 'lotus' },
  { bg1: '#421B27', bg2: '#210A12', accent: '#FFBE76', text: '#FFFDF9', glow: '#C59A62', motif: 'mandala' },
  { bg1: '#3D2615', bg2: '#1F120A', accent: '#F6E58D', text: '#FFFDF9', glow: '#B87352', motif: 'temple' },
  { bg1: '#1F2421', bg2: '#0E110F', accent: '#E7C169', text: '#FAF7F2', glow: '#C59A62', motif: 'diya' },
];

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function generateSvg(pandal, idx, palette) {
  const width = 800;
  const height = 500;
  const name = escapeXml(pandal.name);
  const area = escapeXml(pandal.area || pandal.city || 'Kolkata');
  const category = escapeXml(pandal.category || 'Puja Pandal');
  const num = String(idx + 1).padStart(2, '0');

  // SVG motifs
  let motifSvg = '';
  if (palette.motif === 'mandala') {
    motifSvg = `
      <g opacity="0.18" transform="translate(400, 200)">
        <circle r="140" fill="none" stroke="${palette.accent}" stroke-width="2" stroke-dasharray="6,6"/>
        <circle r="110" fill="none" stroke="${palette.accent}" stroke-width="3"/>
        <circle r="80" fill="none" stroke="${palette.glow}" stroke-width="1.5" stroke-dasharray="4,4"/>
        <circle r="50" fill="none" stroke="${palette.accent}" stroke-width="2"/>
        <path d="M0 -140 L0 140 M-140 0 L140 0 M-100 -100 L100 100 M-100 100 L100 -100" stroke="${palette.accent}" stroke-width="1.5"/>
        <polygon points="0,-90 64,-64 90,0 64,64 0,90 -64,64 -90,0 -64,-64" fill="none" stroke="${palette.glow}" stroke-width="2"/>
      </g>`;
  } else if (palette.motif === 'temple') {
    motifSvg = `
      <g opacity="0.22" transform="translate(400, 210)">
        <path d="M-150 100 L-120 -20 L-60 -70 L0 -120 L60 -70 L120 -20 L150 100 Z" fill="none" stroke="${palette.accent}" stroke-width="3"/>
        <path d="M-80 100 L-50 10 L0 -40 L50 10 L80 100 Z" fill="none" stroke="${palette.glow}" stroke-width="2"/>
        <circle cx="0" cy="-125" r="10" fill="${palette.accent}"/>
        <line x1="0" y1="-135" x2="0" y2="-160" stroke="${palette.accent}" stroke-width="3"/>
      </g>`;
  } else if (palette.motif === 'lotus') {
    motifSvg = `
      <g opacity="0.25" transform="translate(400, 200)">
        <path d="M0 -80 C-40 -40 -60 20 0 70 C60 20 40 -40 0 -80 Z" fill="none" stroke="${palette.accent}" stroke-width="2.5"/>
        <path d="M-20 -50 C-70 -20 -80 30 -10 65 C30 30 10 -20 -20 -50 Z" fill="none" stroke="${palette.glow}" stroke-width="2"/>
        <path d="M20 -50 C70 -20 80 30 10 65 C-30 30 -10 -20 20 -50 Z" fill="none" stroke="${palette.glow}" stroke-width="2"/>
        <circle cx="0" cy="70" r="8" fill="${palette.accent}"/>
      </g>`;
  } else {
    // Diya motif
    motifSvg = `
      <g opacity="0.25" transform="translate(400, 190)">
        <path d="M-90 30 Q0 90 90 30 Q50 0 0 10 Q-50 0 -90 30 Z" fill="none" stroke="${palette.accent}" stroke-width="3"/>
        <path d="M0 -30 Q-25 -70 0 -110 Q25 -70 0 -30 Z" fill="${palette.glow}" opacity="0.8"/>
        <circle cx="0" cy="-60" r="15" fill="${palette.accent}"/>
      </g>`;
  }

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.bg1}"/>
        <stop offset="100%" stop-color="${palette.bg2}"/>
      </linearGradient>
      <radialGradient id="glowGrad" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="cardOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.1"/>
        <stop offset="55%" stop-color="#000000" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#1A0D08" stop-opacity="0.95"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
    <circle cx="${width / 2}" cy="180" r="280" fill="url(#glowGrad)"/>

    <!-- Decorative Border -->
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="16" fill="none" stroke="${palette.accent}" stroke-width="1.5" stroke-opacity="0.35"/>
    <rect x="28" y="28" width="${width - 56}" height="${height - 56}" rx="12" fill="none" stroke="${palette.glow}" stroke-width="0.75" stroke-opacity="0.25"/>

    <!-- Corner Accents -->
    <path d="M 28 48 L 48 48 L 48 28" fill="none" stroke="${palette.accent}" stroke-width="2" opacity="0.6"/>
    <path d="M ${width - 28} 48 L ${width - 48} 48 L ${width - 48} 28" fill="none" stroke="${palette.accent}" stroke-width="2" opacity="0.6"/>
    <path d="M 28 ${height - 48} L 48 ${height - 48} L 48 ${height - 28}" fill="none" stroke="${palette.accent}" stroke-width="2" opacity="0.6"/>
    <path d="M ${width - 28} ${height - 48} L ${width - 48} ${height - 48} L ${width - 48} ${height - 28}" fill="none" stroke="${palette.accent}" stroke-width="2" opacity="0.6"/>

    <!-- Sacred Motif -->
    ${motifSvg}

    <!-- Gradient Overlay for Contrast -->
    <rect width="${width}" height="${height}" fill="url(#cardOverlay)"/>

    <!-- Top Badge Row -->
    <g transform="translate(45, 55)">
      <rect x="0" y="0" width="130" height="26" rx="13" fill="${palette.accent}" fill-opacity="0.2" stroke="${palette.accent}" stroke-width="1" stroke-opacity="0.6"/>
      <text x="65" y="17" font-family="'DM Sans', system-ui, sans-serif" font-size="11" font-weight="700" fill="${palette.accent}" text-anchor="middle" letter-spacing="1.5">PUJA SPOT #${num}</text>
    </g>

    <g transform="translate(${width - 185}, 55)">
      <rect x="0" y="0" width="140" height="26" rx="13" fill="#000000" fill-opacity="0.4" stroke="#FFFDF9" stroke-width="1" stroke-opacity="0.2"/>
      <text x="70" y="17" font-family="'DM Sans', system-ui, sans-serif" font-size="11" font-weight="600" fill="#FFFDF9" text-anchor="middle">${area}</text>
    </g>

    <!-- Bottom Content Card Details -->
    <g transform="translate(45, ${height - 115})">
      <!-- Category Pill -->
      <rect x="0" y="-32" width="${category.length * 8 + 24}" height="22" rx="11" fill="${palette.glow}" fill-opacity="0.25" stroke="${palette.glow}" stroke-width="1"/>
      <text x="12" y="-17" font-family="'DM Sans', system-ui, sans-serif" font-size="11" font-weight="600" fill="${palette.accent}">${category}</text>

      <!-- Pandal Name -->
      <text x="0" y="24" font-family="'Cormorant Garamond', Georgia, serif" font-size="34" font-weight="700" fill="#FFFDF9" letter-spacing="0.5">
        ${name}
      </text>

      <!-- Bottom Subtitle / Location -->
      <text x="0" y="58" font-family="'DM Sans', system-ui, sans-serif" font-size="13" font-weight="500" fill="#E9DED2" opacity="0.85">
        ✦ Kolkata Durga Puja 2026 • Live Festive Destination
      </text>
    </g>
  </svg>
  `;
}

function generateFallbackSvg() {
  const width = 800;
  const height = 500;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="fbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3A2118"/>
        <stop offset="50%" stop-color="#24140E"/>
        <stop offset="100%" stop-color="#140A07"/>
      </linearGradient>
      <radialGradient id="fbGlow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#C59A62" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#C59A62" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#fbGrad)"/>
    <circle cx="400" cy="200" r="260" fill="url(#fbGlow)"/>

    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="16" fill="none" stroke="#C59A62" stroke-width="1.5" stroke-opacity="0.4"/>

    <!-- Central Diya / Festive Symbol -->
    <g transform="translate(400, 180)">
      <circle r="70" fill="none" stroke="#C59A62" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/>
      <path d="M-50 20 Q0 60 50 20 Q30 0 0 10 Q-30 0 -50 20 Z" fill="#B87352" stroke="#C59A62" stroke-width="2"/>
      <path d="M0 -20 Q-15 -50 0 -80 Q15 -50 0 -20 Z" fill="#FFD166"/>
      <circle cx="0" cy="-45" r="8" fill="#FFFDF9"/>
    </g>

    <g transform="translate(400, 340)" text-anchor="middle">
      <text y="0" font-family="'Cormorant Garamond', Georgia, serif" font-size="32" font-weight="700" fill="#FFFDF9">
        Pujofy Festive Destination
      </text>
      <text y="30" font-family="'DM Sans', system-ui, sans-serif" font-size="13" font-weight="500" fill="#C59A62">
        Durga Puja 2026 • Live Puja Pandal
      </text>
    </g>
  </svg>
  `;
}

async function run() {
  console.log(`Generating 32 unique pandal WebP images and fallback into ${outputDir}...`);

  for (let i = 0; i < pandals.length; i++) {
    const pandal = pandals[i];
    const num = String(i + 1).padStart(3, '0');
    const palette = PALETTES[i % PALETTES.length];
    const svg = generateSvg(pandal, i, palette);

    const filename = `pandal-${num}.webp`;
    const dest = path.join(outputDir, filename);

    await sharp(Buffer.from(svg))
      .webp({ quality: 90 })
      .toFile(dest);
    
    console.log(`✓ Generated ${filename} for ${pandal.name}`);
  }

  // Fallback image
  const fallbackSvg = generateFallbackSvg();
  const fallbackDest = path.join(outputDir, 'fallback.webp');
  await sharp(Buffer.from(fallbackSvg))
    .webp({ quality: 90 })
    .toFile(fallbackDest);
  console.log(`✓ Generated fallback.webp`);

  console.log('All 32 festive pandal images + fallback generated successfully!');
}

run().catch(console.error);
