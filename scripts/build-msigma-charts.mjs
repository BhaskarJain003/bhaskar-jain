/**
 * Reads public/projects/phys6260-hw2/msigma_clean.csv and writes
 * public/projects/phys6260-hw2/msigma-charts.json for the React + Observable Plot island.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const csvPath = path.join(root, "public", "projects", "phys6260-hw2", "msigma_clean.csv");
const outPath = path.join(root, "public", "projects", "phys6260-hw2", "msigma-charts.json");

const SIGMA_REF = 200;

function mulberry32(a) {
	return function () {
		let t = (a += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function polyfit1(x, y) {
	const n = x.length;
	let sx = 0,
		sy = 0,
		sxx = 0,
		sxy = 0;
	for (let i = 0; i < n; i++) {
		sx += x[i];
		sy += y[i];
		sxx += x[i] * x[i];
		sxy += x[i] * y[i];
	}
	const d = n * sxx - sx * sx;
	const b = (n * sxy - sx * sy) / d;
	const alpha = (sy - b * sx) / n;
	return { b, alpha };
}

function A_msun(alpha, b) {
	return Math.pow(10, alpha - b * Math.log10(SIGMA_REF));
}

function log10(x) {
	return Math.log(x) / Math.LN10;
}

function loadCsv(text) {
	const lines = text.trim().split(/\r?\n/);
	const header = lines[0].split(",");
	const rows = [];
	for (let i = 1; i < lines.length; i++) {
		const cols = lines[i].split(",");
		if (cols.length < header.length) continue;
		const row = {};
		for (let j = 0; j < header.length; j++) row[header[j]] = cols[j];
		rows.push(row);
	}
	return rows;
}

function ingest(rows) {
	const x = [];
	const y = [];
	const sx = [];
	const sy = [];
	for (const r of rows) {
		const M = Number(r.M_bh_Msun);
		const mlo = Number(r.M_err_lo);
		const mhi = Number(r.M_err_hi);
		const sig = Number(r.sigma_kms);
		const slo = Number(r.sigma_err_lo);
		const shi = Number(r.sigma_err_hi);
		const Mlo = M - mlo;
		const Mhi = M + mhi;
		const sloA = sig - slo;
		const shiA = sig + shi;
		if (Mlo <= 0 || sloA <= 0) continue;
		const yi = log10(M);
		const lx = log10(sig);
		const sigma_y_dex = (yi - log10(Mlo) + (log10(Mhi) - yi)) / 2;
		const sigma_x_dex = (lx - log10(sloA) + (log10(shiA) - lx)) / 2;
		const xi = log10(sig / SIGMA_REF);
		x.push(xi);
		y.push(yi);
		sx.push(sigma_x_dex);
		sy.push(sigma_y_dex);
	}
	return { x, y, sx, sy };
}

function bin1d(values, binCount) {
	let lo = Math.min(...values);
	let hi = Math.max(...values);
	if (lo === hi) {
		hi = lo + 1e-6;
	}
	const width = (hi - lo) / binCount;
	const counts = new Array(binCount).fill(0);
	for (const v of values) {
		let k = Math.floor((v - lo) / width);
		if (k < 0) k = 0;
		if (k >= binCount) k = binCount - 1;
		counts[k]++;
	}
	const edges = [];
	for (let i = 0; i <= binCount; i++) edges.push(lo + i * width);
	return { edges, counts, lo, hi, width };
}

function main() {
	if (!fs.existsSync(csvPath)) {
		console.warn(`[build-msigma-charts] Skip: missing ${csvPath}`);
		return;
	}
	const raw = fs.readFileSync(csvPath, "utf8");
	const rows = loadCsv(raw);
	const { x, y, sx, sy } = ingest(rows);
	const n = x.length;
	if (n < 5) throw new Error("Too few galaxies after ingest");

	const ols = polyfit1(x, y);
	const { b: bOls, alpha: alphaOls } = ols;

	const scatter = [];
	for (let i = 0; i < n; i++) {
		scatter.push({
			x: x[i],
			y: y[i],
			sx: sx[i],
			sy: sy[i],
		});
	}

	const xMin = Math.min(...x);
	const xMax = Math.max(...x);
	const lineX = [];
	const lineY = [];
	for (let i = 0; i <= 120; i++) {
		const t = xMin + (i / 120) * (xMax - xMin);
		lineX.push(t);
		lineY.push(alphaOls + bOls * t);
	}

	const rng = mulberry32(42);
	const corner = [];
	const NB = 1200;
	for (let rep = 0; rep < NB; rep++) {
		const xs = [];
		const ys = [];
		const sxe = [];
		const sye = [];
		for (let j = 0; j < n; j++) {
			const k = Math.floor(rng() * n);
			xs.push(x[k]);
			ys.push(y[k]);
			sxe.push(sx[k]);
			sye.push(sy[k]);
		}
		const { b, alpha } = polyfit1(xs, ys);
		const A = A_msun(alpha, b);
		corner.push({ b, log10A: log10(A) });
	}

	const st = [];
	const z = [];
	for (let i = 0; i < n; i++) {
		const tot = Math.sqrt(sy[i] ** 2 + (bOls * sx[i]) ** 2);
		st.push(tot);
		z.push((y[i] - alphaOls - bOls * x[i]) / tot);
	}
	const residualHist = bin1d(z, 28);

	const payload = {
		meta: {
			nGalaxies: n,
			olsAlpha: alphaOls,
			olsB: bOls,
			description:
				"Scatter uses the cleaned McConnell & Ma sample; the red line is an OLS fit in (x, y) log-space (same initialization used before MCMC in the homework script). The hexbin panel shows a bootstrap resample of galaxies per draw (not the emcee posterior). The histogram is standardized OLS residuals (not the ε marginal from the extended model). For full MCMC figures, run hw2_msigma.py in the GitHub repo.",
		},
		scatter,
		fitLine: { x: lineX, y: lineY },
		corner,
		residualHist,
	};

	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	fs.writeFileSync(outPath, JSON.stringify(payload), "utf8");
	console.log(`[build-msigma-charts] Wrote ${outPath} (${n} galaxies)`);
}

main();
