import * as Plot from '@observablehq/plot';
import { useEffect, useRef, useState } from 'react';
import './AE6050Charts.css';

// ── helpers ────────────────────────────────────────────────────────────────────

function isoP(p0: number, M0: number, M1: number): number {
	const g = 1.4;
	return p0 * Math.pow(
		(1 + (g - 1) / 2 * M0 * M0) / (1 + (g - 1) / 2 * M1 * M1),
		g / (g - 1)
	);
}

function isoT(T0: number, M0: number, M1: number): number {
	const g = 1.4;
	return T0 * (1 + (g - 1) / 2 * M0 * M0) / (1 + (g - 1) / 2 * M1 * M1);
}

function chartW(el: HTMLElement | null, fallback: number): number {
	if (!el || typeof window === 'undefined') return Math.min(720, fallback);
	return Math.min(720, Math.max(280, el.clientWidth || fallback));
}

// ── embedded data ─────────────────────────────────────────────────────────────

const TAU_FLOW = 2.150258e-5;

// Ordered ascending tau
const TIMESCALE_DATA = [
	{ process: 'O₂ vibration',     tau: 1.005e-5, regime: 'Nonequilibrium' },
	{ process: 'N₂ vibration',     tau: 4.010e-4, regime: 'Frozen'         },
	{ process: 'O₂ dissociation',  tau: 3.735e-1, regime: 'Frozen'         },
	{ process: 'N₂ dissociation',  tau: 5.834e6,  regime: 'Frozen'         },
];

const FORCE_DATA = [
	{ case: 'Frozen',           CL: 0.2305, CD: 0.02038 },
	{ case: 'Nonequilibrium',   CL: 0.2207, CD: 0.02099 },
	{ case: 'Equilibrium',      CL: 0.2139, CD: 0.02117 },
	{ case: '22° ramp (A)',     CL: 0.3042, CD: 0.03898 },
	{ case: '10° expan. (B)',   CL: 0.2089, CD: 0.01931 },
];

// ── generated data ─────────────────────────────────────────────────────────────

interface FlatPoint { x: number; T: number; Tv: number }

function makeFlatData(n = 60): FlatPoint[] {
	// Characteristic vibrational relaxation length λ fitted so Tv(10 cm) ≈ 1812 K
	const lambda = 0.1965;
	const T2 = 3034.4;
	const T3 = 2818.6;
	const Tv0 = 1000.0;
	const norm = 1 - Math.exp(-0.10 / lambda);
	return Array.from({ length: n }, (_, i) => {
		const xm = (i / (n - 1)) * 0.10;
		const frac = (1 - Math.exp(-xm / lambda)) / norm;
		const T  = T2 + (T3 - T2) * frac;
		const Tv = T2 - (T2 - Tv0) * Math.exp(-xm / lambda);
		return { x: xm * 100, T, Tv };
	});
}

interface ProfilePoint {
	s: number; p: number; T: number; M: number; model: string;
}

function makeExpansionSeg(
	p3: number, T3: number, M3: number, M4: number,
	sStart: number, sEnd: number, model: string, n = 35
): ProfilePoint[] {
	return Array.from({ length: n }, (_, i) => {
		const t = i / (n - 1);
		const M = M3 + (M4 - M3) * t;
		return {
			s:     (sStart + (sEnd - sStart) * t) * 100,
			p:     isoP(p3, M3, M),
			T:     isoT(T3, M3, M),
			M,
			model,
		};
	});
}

function makeProfileData(): ProfilePoint[] {
	const pts: ProfilePoint[] = [];
	const MODELS = ['Frozen', 'Nonequilibrium', 'Equilibrium'] as const;

	// Compression ramp — identical for all models (frozen oblique shock)
	for (const model of MODELS) {
		pts.push({ s: 0,  p: 18675, T: 3034.4, M: 4.212, model });
		pts.push({ s: 10, p: 18675, T: 3034.4, M: 4.212, model });
	}

	// Flat section — Frozen: no change
	pts.push({ s: 20, p: 18675, T: 3034.4, M: 4.212, model: 'Frozen' });

	// Flat section — Nonequilibrium: coupled ODE relaxation
	const lambda = 0.1965;
	const norm   = 1 - Math.exp(-0.10 / lambda);
	for (let i = 1; i <= 25; i++) {
		const xm   = (i / 25) * 0.10;
		const frac = (1 - Math.exp(-xm / lambda)) / norm;
		pts.push({
			s: (0.10 + xm) * 100,
			p: 18675 + (17295 - 18675) * frac,
			T: 3034.4 + (2818.6 - 3034.4) * frac,
			M: 4.212  + (4.373  - 4.212)  * frac,
			model: 'Nonequilibrium',
		});
	}

	// Flat section — Equilibrium: instantaneous reactive jump, then constant
	pts.push({ s: 10.15, p: 16889, T: 2702, M: 4.418, model: 'Equilibrium' });
	pts.push({ s: 20,    p: 16889, T: 2702, M: 4.418, model: 'Equilibrium' });

	// Expansion ramps — isentropic fan, frozen composition
	pts.push(...makeExpansionSeg(18675, 3034.4, 4.212, 4.750, 0.20, 0.30, 'Frozen'));
	pts.push(...makeExpansionSeg(17295, 2818.6, 4.373, 4.945, 0.20, 0.30, 'Nonequilibrium'));
	pts.push(...makeExpansionSeg(16889, 2702.0, 4.418, 5.007, 0.20, 0.30, 'Equilibrium'));

	return pts;
}

// ── Timescale chart ────────────────────────────────────────────────────────────

export function TimescaleChart() {
	const wrapRef = useRef<HTMLDivElement>(null);
	const plotRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = plotRef.current;
		if (!el) return;
		el.innerHTML = '';
		const w = chartW(wrapRef.current, 680);

		const plot = Plot.plot({
			title: 'Physical timescales vs. flow residence time',
			width: w,
			height: 255,
			marginLeft: 130,
			marginRight: 24,
			marginTop: 46,
			marginBottom: 48,
			style: { fontFamily: 'system-ui, sans-serif', fontSize: '11px' },
			x: {
				type:  'log',
				label: 'Timescale (seconds) →',
				domain: [1e-7, 1e9],
				tickFormat: (d: number) => {
					const exp = Math.round(Math.log10(d));
					const sup = String(Math.abs(exp)).split('').map(c =>
						'⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(c)]
					).join('');
					return exp < 0 ? `10⁻${sup}` : `10${sup}`;
				},
			},
			color: {
				domain: ['Nonequilibrium', 'Frozen'],
				range:  ['#c44e52', '#bdc5d1'],
				legend: true,
			},
			marks: [
				Plot.barX(TIMESCALE_DATA, {
					y:    'process',
					x1:   1e-7,
					x2:   'tau',
					fill: 'regime',
					rx:   3,
					sort: { y: 'x2', order: 'ascending' },
				}),
				// τ_flow reference line
				Plot.ruleX([TAU_FLOW], {
					stroke:          '#0f1219',
					strokeWidth:     2.5,
					strokeDasharray: '7 4',
				}),
			],
		});

		el.append(plot);

		// Inject proper τ_flow subscript label via SVG tspan
		if (typeof document !== 'undefined') {
			const svg = el.querySelector('svg') as SVGSVGElement | null;
			if (svg) {
				const mL = 130, mR = 24, mT = 46;
				const totalW = parseFloat(svg.getAttribute('width') || String(w));
				const pW = totalW - mL - mR;
				const logFrac = (Math.log10(TAU_FLOW) - (-7)) / (9 - (-7));
				const xPx = mL + logFrac * pW;

				const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				txt.setAttribute('x', String(xPx));
				txt.setAttribute('y', String(mT - 8));
				txt.setAttribute('text-anchor', 'middle');
				txt.setAttribute('font-size', '10.5');
				txt.setAttribute('font-family', 'system-ui, sans-serif');
				txt.setAttribute('fill', '#0f1219');

				const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
				t1.textContent = 'τ';

				const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
				t2.setAttribute('font-size', '8');
				t2.setAttribute('dy', '2.5');
				t2.textContent = 'flow';

				const t3 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
				t3.setAttribute('dy', '-2.5');
				t3.setAttribute('font-size', '10.5');
				t3.textContent = ' = 21 μs';

				txt.appendChild(t1);
				txt.appendChild(t2);
				txt.appendChild(t3);
				svg.appendChild(txt);
			}
		}

		return () => { plot.remove(); };
	}, []);

	return (
		<div className="ae6050-chart" ref={wrapRef}>
			<div ref={plotRef} />
			<p className="ae6050-caption">
				The dashed vertical line is the flow residence time — how long the gas actually
				spends on the 10 cm flat section. O₂ vibrational relaxation is in the same
				ballpark, so it partially happens. Everything else is either already done or nowhere
				near done.
			</p>
		</div>
	);
}

// ── Flat section evolution chart ───────────────────────────────────────────────

export function FlatSectionChart() {
	const wrapRef = useRef<HTMLDivElement>(null);
	const plotRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = plotRef.current;
		if (!el) return;
		el.innerHTML = '';
		const w = chartW(wrapRef.current, 680);

		const flatData = makeFlatData();
		type Row = { x: number; T: number; series: string };
		const series: Row[] = [
			...flatData.map(d => ({ x: d.x, T: d.T,  series: 'Translational T' })),
			...flatData.map(d => ({ x: d.x, T: d.Tv, series: 'Vibrational T'   })),
		];

		const plot = Plot.plot({
			title: 'Temperature evolution along the flat section',
			width: w,
			height: 320,
			marginLeft: 54,
			marginRight: 24,
			marginTop:   38,
			marginBottom: 44,
			style: { fontFamily: 'system-ui, sans-serif', fontSize: '11px' },
			color: {
				domain: ['Translational T', 'Vibrational T'],
				range:  ['#496A81', '#c44e52'],
				legend: true,
			},
			marks: [
				// Shade the gap between T and Tv
				Plot.areaY(flatData, {
					x:    'x',
					y1:   'Tv',
					y2:   'T',
					fill: 'rgba(73,106,129,0.08)',
				}),
				Plot.line(series, {
					x:           'x',
					y:           'T',
					stroke:      'series',
					strokeWidth: 2.2,
				}),
			],
			x: { label: 'Distance along flat section (cm) →', domain: [0, 10], grid: true },
			y: { label: '↑ Temperature (K)', domain: [750, 3250], grid: true },
		});

		el.append(plot);
		return () => { plot.remove(); };
	}, []);

	return (
		<div className="ae6050-chart" ref={wrapRef}>
			<div ref={plotRef} />
			<p className="ae6050-caption">
				The shaded region is the gap between translational and vibrational temperature —
				a direct measure of how far out of equilibrium the gas is. Vibrational T enters
				at 1,000 K (the shock left it behind) and climbs to 1,812 K by the end,
				but the two temperatures never meet in the 10 cm available.
			</p>
		</div>
	);
}

// ── Full airfoil profile chart ─────────────────────────────────────────────────

type Metric = 'p' | 'T' | 'M';

export function AirfoilProfileChart() {
	const wrapRef = useRef<HTMLDivElement>(null);
	const plotRef = useRef<HTMLDivElement>(null);
	const [metric, setMetric] = useState<Metric>('p');

	useEffect(() => {
		const el = plotRef.current;
		if (!el) return;
		el.innerHTML = '';
		const w = chartW(wrapRef.current, 680);

		const profileData = makeProfileData();
		const yLabel: Record<Metric, string> = {
			p: '↑ Pressure (Pa)',
			T: '↑ Temperature (K)',
			M: '↑ Mach number',
		};
		const title: Record<Metric, string> = {
			p: 'Pressure distribution along the lower surface',
			T: 'Temperature distribution along the lower surface',
			M: 'Mach number distribution along the lower surface',
		};
		const plot = Plot.plot({
			title:  title[metric],
			width:  w,
			height: 320,
			marginLeft:   62,
			marginRight:  24,
			marginTop:    38,
			marginBottom: 44,
			style: { fontFamily: 'system-ui, sans-serif', fontSize: '11px' },
			color: {
				legend: true,
				domain: ['Frozen', 'Nonequilibrium', 'Equilibrium'],
				range:  ['#496A81', '#c44e52', '#5a9e6f'],
			},
			marks: [
				Plot.ruleX([10, 20], {
					stroke:          '#d5dbe6',
					strokeDasharray: '5 3',
				}),
				Plot.text(
					[
						{ s: 5,  label: 'Shock\nramp'    },
						{ s: 15, label: 'Flat\nsection'  },
						{ s: 25, label: 'Expansion\nramp'},
					],
					{ x: 's', frameAnchor: 'top', text: 'label', fontSize: 8.5, fill: '#999', dy: 6 }
				),
				Plot.line(profileData, {
					x:           's',
					y:           metric,
					stroke:      'model',
					strokeWidth: 2.1,
				}),
			],
			x: { label: 'Arc length along lower surface (cm) →', domain: [0, 30] },
			y: { label: yLabel[metric] },
		});

		el.append(plot);
		return () => { plot.remove(); };
	}, [metric]);

	return (
		<div className="ae6050-chart" ref={wrapRef}>
			<div className="ae6050-tabs">
				{(['p', 'T', 'M'] as Metric[]).map(m => (
					<button
						key={m}
						onClick={() => setMetric(m)}
						className={metric === m ? 'ae6050-tab--active' : ''}
					>
						{m === 'p' ? 'Pressure' : m === 'T' ? 'Temperature' : 'Mach'}
					</button>
				))}
			</div>
			<div ref={plotRef} />
			<p className="ae6050-caption">
				All three models share the same oblique shock (left segment). The frozen model
				holds constant across the flat section. The equilibrium model drops abruptly at the
				flat-section entrance (energy absorbed by chemistry). The nonequilibrium model
				relaxes smoothly between the two extremes.
			</p>
		</div>
	);
}

// ── Force coefficient chart ────────────────────────────────────────────────────

export function ForceCoeffChart() {
	const wrapRef = useRef<HTMLDivElement>(null);
	const plotRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = plotRef.current;
		if (!el) return;
		el.innerHTML = '';
		const w = chartW(wrapRef.current, 680);

		const lodVals = [8, 10, 12];
		const cdMax   = 0.046;
		const lodLines = lodVals.flatMap(ld => [
			{ x: 0.014, y: 0.014 * ld, ld },
			{ x: cdMax,  y: cdMax  * ld, ld },
		]);

		const pointColors: Record<string, string> = {
			'Frozen':          '#496A81',
			'Nonequilibrium':  '#c44e52',
			'Equilibrium':     '#5a9e6f',
			'22° ramp (A)':    '#e07b39',
			'10° expan. (B)':  '#9b59b6',
		};

		const plot = Plot.plot({
			title:  'Lift vs. drag — three gas models and two design variants',
			width:  w,
			height: 360,
			marginLeft:   52,
			marginRight:  24,
			marginTop:    38,
			marginBottom: 52,
			style: { fontFamily: 'system-ui, sans-serif', fontSize: '11px' },
			x: { label: 'Drag coefficient (Cᴅ) →', domain: [0.015, 0.045] },
			y: { label: '↑ Lift coefficient (Cʟ)',  domain: [0.175, 0.34]  },
			marks: [
				Plot.line(lodLines, {
					x: 'x', y: 'y', z: 'ld',
					stroke: '#e0e4ea', strokeWidth: 1,
				}),
				Plot.text(
					lodVals.map(ld => ({ x: cdMax * 0.95, y: cdMax * 0.95 * ld, ld })),
					{ x: 'x', y: 'y', text: (d: { ld: number }) => `L/D = ${d.ld}`, fontSize: 8.5, fill: '#bbb', dx: 6 }
				),
				Plot.dot(FORCE_DATA, {
					x: 'CD', y: 'CL',
					fill: (d: typeof FORCE_DATA[0]) => pointColors[d.case] ?? '#999',
					r: 7, stroke: 'white', strokeWidth: 1.5,
				}),
				Plot.text(FORCE_DATA, {
					x: 'CD', y: 'CL', text: 'case',
					dy: -13, fontSize: 9.5, fill: '#333',
				}),
			],
		});

		el.append(plot);
		return () => { plot.remove(); };
	}, []);

	return (
		<div className="ae6050-chart" ref={wrapRef}>
			<div ref={plotRef} />
			<p className="ae6050-caption">
				The three gas-model points (blue, red, green) cluster near the same Cᴅ but spread
				vertically — real-gas effects mostly cost lift, not drag. The design variants pull away:
				steeper compression (orange) trades a large lift gain for a large drag penalty,
				while deeper expansion (purple) trims drag with barely any lift loss.
			</p>
		</div>
	);
}
