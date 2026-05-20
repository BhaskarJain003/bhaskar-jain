/**
 * Generates static Open Graph preview PNGs (1200×630) for thoughts that
 * don't ship a ready-made figure asset.
 *
 *   npm run og-previews
 *
 * - M–σ card: resized from public/projects/phys6260-hw2/figure_msigma_datafit_baseline.png
 * - Asteroid + fair-flip: SVG → PNG (edit inline SVG in this file, then re-run)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const ogDir = path.join(root, 'src', 'assets', 'og');

fs.mkdirSync(ogDir, { recursive: true });

const W = 1200;
const H = 630;

/** @param {string} name */
function wrapSvg(inner) {
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f1219"/>
      <stop offset="100%" stop-color="#1e2a3a"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${inner}
</svg>`;
}

const asteroidInner = `
  <text x="60" y="88" fill="#e8eef5" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="600">Asteroid mining cost model</text>
  <text x="60" y="138" fill="#96a3b8" font-family="Georgia, 'Times New Roman', serif" font-size="22">$/kg delivered to LEO · NEA fleet curve (illustrative)</text>
  <rect x="60" y="200" width="1080" height="360" rx="10" fill="#151a24" stroke="#496A81" stroke-width="2"/>
  <!-- Axes -->
  <line x1="120" y1="500" x2="1080" y2="500" stroke="#5c6b82" stroke-width="2"/>
  <line x1="120" y1="500" x2="120" y2="240" stroke="#5c6b82" stroke-width="2"/>
  <!-- Fake fleet curve -->
  <path d="M 140 460 C 280 420, 420 200, 620 260 S 980 180, 1040 220" fill="none" stroke="#7eb8da" stroke-width="4"/>
  <circle cx="140" cy="460" r="6" fill="#c9e4f5"/>
  <circle cx="620" cy="260" r="6" fill="#c9e4f5"/>
  <circle cx="1040" cy="220" r="6" fill="#c9e4f5"/>
  <text x="120" y="535" fill="#7a8aa0" font-family="Georgia, serif" font-size="16">Fleet size N →</text>
  <text x="40" y="360" fill="#7a8aa0" font-family="Georgia, serif" font-size="16" transform="rotate(-90 40 360)">$/kg →</text>
`;

const fairFlipInner = `
  <text x="60" y="88" fill="#e8eef5" font-family="Georgia, 'Times New Roman', serif" font-size="42" font-weight="600">Fair flip from an unfair coin</text>
  <text x="60" y="138" fill="#96a3b8" font-family="Georgia, 'Times New Roman', serif" font-size="22">Von Neumann · HT vs TH symmetry (schematic)</text>
  <!-- Punnett-style 2×2 -->
  <g transform="translate(360, 200)">
    <rect x="0" y="0" width="240" height="240" fill="#151a24" stroke="#496A81" stroke-width="2"/>
    <line x1="120" y1="0" x2="120" y2="240" stroke="#496A81" stroke-width="2"/>
    <line x1="0" y1="120" x2="240" y2="120" stroke="#496A81" stroke-width="2"/>
    <text x="60" y="78" text-anchor="middle" fill="#c9e4f5" font-family="Georgia, serif" font-size="36" font-weight="600">HH</text>
    <text x="180" y="78" text-anchor="middle" fill="#7eb8da" font-family="Georgia, serif" font-size="36" font-weight="600">HT</text>
    <text x="60" y="198" text-anchor="middle" fill="#7eb8da" font-family="Georgia, serif" font-size="36" font-weight="600">TH</text>
    <text x="180" y="198" text-anchor="middle" fill="#c9e4f5" font-family="Georgia, serif" font-size="36" font-weight="600">TT</text>
    <text x="120" y="285" text-anchor="middle" fill="#7a8aa0" font-family="Georgia, serif" font-size="18">discard HH / TT · use HT or TH</text>
  </g>
  <text x="60" y="580" fill="#6b7c94" font-family="Georgia, serif" font-size="18">Interactive visualization on the page</text>
`;

async function svgToPng(name, inner) {
	const buf = Buffer.from(wrapSvg(inner), 'utf8');
	const out = path.join(ogDir, name);
	await sharp(buf).png().toFile(out);
	console.log(`[og-previews] wrote ${out}`);
}

const msigmaPublic = path.join(
	root,
	'public',
	'projects',
	'phys6260-hw2',
	'figure_msigma_datafit_baseline.png',
);
const msigmaOut = path.join(ogDir, 'phys6260-msigma-og.png');
if (fs.existsSync(msigmaPublic)) {
	await sharp(msigmaPublic)
		.resize(W, H, { fit: 'cover', position: 'centre' })
		.png()
		.toFile(msigmaOut);
	console.log(`[og-previews] wrote ${msigmaOut} (from public figure)`);
} else {
	console.warn(`[og-previews] skip phys6260: missing ${msigmaPublic}`);
}

await svgToPng('asteroid-mining-og.png', asteroidInner);
await svgToPng('fair-flip-unfair-coin-og.png', fairFlipInner);
