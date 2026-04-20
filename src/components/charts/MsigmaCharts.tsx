import * as Plot from '@observablehq/plot';
import { useEffect, useRef, useState } from 'react';

import './MsigmaCharts.css';

type ChartPayload = {
	meta: {
		nGalaxies: number;
		olsAlpha: number;
		olsB: number;
		description: string;
	};
	scatter: { x: number; y: number; sx: number; sy: number }[];
	fitLine: { x: number[]; y: number[] };
	corner: { b: number; log10A: number }[];
	residualHist: { edges: number[]; counts: number[]; lo: number; hi: number };
};

function linePoints(fit: { x: number[]; y: number[] }) {
	return fit.x.map((x, i) => ({ x, y: fit.y[i] }));
}

function chartWidth(container: HTMLElement | null, fallback: number) {
	if (!container || typeof window === 'undefined') return Math.min(720, fallback);
	return Math.min(720, Math.max(280, container.clientWidth || fallback));
}

export default function MsigmaCharts() {
	const wrapRef = useRef<HTMLDivElement>(null);
	const scatterRef = useRef<HTMLDivElement>(null);
	const cornerRef = useRef<HTMLDivElement>(null);
	const residualRef = useRef<HTMLDivElement>(null);
	const [error, setError] = useState<string | null>(null);
	const [caption, setCaption] = useState<string>('');

	useEffect(() => {
		let cancelled = false;
		const roots: HTMLElement[] = [];

		function clear(els: (React.RefObject<HTMLDivElement | null>)[]) {
			for (const r of els) {
				if (r.current) r.current.innerHTML = '';
			}
		}

		clear([scatterRef, cornerRef, residualRef]);

		fetch('/projects/phys6260-hw2/msigma-charts.json')
			.then((r) => {
				if (!r.ok) throw new Error(`Could not load chart data (${r.status})`);
				return r.json() as Promise<ChartPayload>;
			})
			.then((data) => {
				if (cancelled) return;
				setCaption(data.meta.description);

				const w1 = chartWidth(wrapRef.current, 680);
				const scatter = data.scatter;
				const hseg = scatter.map((d) => ({ x1: d.x - d.sx, x2: d.x + d.sx, y: d.y }));
				const vseg = scatter.map((d) => ({ x: d.x, y1: d.y - d.sy, y2: d.y + d.sy }));
				const fitPts = linePoints(data.fitLine);

				const pScatter = Plot.plot({
					title: 'Data in log space + OLS guide',
					width: w1,
					height: 380,
					marginLeft: 52,
					marginRight: 12,
					marginTop: 36,
					marginBottom: 44,
					style: { fontFamily: 'system-ui, sans-serif', fontSize: '11px' },
					marks: [
						Plot.link(hseg, {
							x1: 'x1',
							x2: 'x2',
							y1: 'y',
							y2: 'y',
							stroke: 'rgba(96,115,159,0.42)',
							strokeWidth: 0.85,
						}),
						Plot.link(vseg, {
							x1: 'x',
							x2: 'x',
							y1: 'y1',
							y2: 'y2',
							stroke: 'rgba(96,115,159,0.42)',
							strokeWidth: 0.85,
						}),
						Plot.dot(scatter, { x: 'x', y: 'y', fill: 'rgb(15,18,25)', r: 3 }),
						Plot.line(fitPts, { x: 'x', y: 'y', stroke: '#c44e52', strokeWidth: 2.4 }),
					],
					x: { label: 'x = log10(sigma / 200 km/s)' },
					y: { label: 'y = log10(M_BH / Msun)' },
				});

				const corner = data.corner;
				const pCorner = Plot.plot({
					title: 'Bootstrap (galaxy resamples)',
					width: w1,
					height: 380,
					marginLeft: 52,
					marginRight: 12,
					marginTop: 36,
					marginBottom: 44,
					style: { fontFamily: 'system-ui, sans-serif', fontSize: '11px' },
					color: { scheme: 'YlGnBu', legend: true },
					marks: [
						Plot.dot(
							corner,
							Plot.hexbin(
								{ fill: 'count' },
								{
									x: 'b',
									y: 'log10A',
									r: 10,
								},
							),
						),
						Plot.frame(),
					],
					x: { label: 'b' },
					y: { label: 'log10 A (Msun)' },
				});

				const { edges, counts } = data.residualHist;
				const bars = counts.map((c, i) => ({
					x0: edges[i],
					x1: edges[i + 1],
					freq: c,
				}));
				const pRes = Plot.plot({
					title: 'Standardized OLS residuals',
					width: w1,
					height: 380,
					marginLeft: 52,
					marginRight: 12,
					marginTop: 36,
					marginBottom: 44,
					style: { fontFamily: 'system-ui, sans-serif', fontSize: '11px' },
					marks: [
						Plot.rectY(bars, {
							x1: 'x0',
							x2: 'x1',
							y: 'freq',
							fill: 'rgb(73, 106, 129)',
							inset: 0.5,
						}),
						Plot.ruleY([0]),
					],
					x: { label: '(y - y_hat) / sigma_tot' },
					y: { label: 'Galaxy count', grid: true },
				});

				if (scatterRef.current) {
					scatterRef.current.append(pScatter);
					roots.push(pScatter);
				}
				if (cornerRef.current) {
					cornerRef.current.append(pCorner);
					roots.push(pCorner);
				}
				if (residualRef.current) {
					residualRef.current.append(pRes);
					roots.push(pRes);
				}
			})
			.catch((e: unknown) => {
				if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load charts');
			});

		return () => {
			cancelled = true;
			for (const el of roots) {
				el.remove();
			}
			clear([scatterRef, cornerRef, residualRef]);
		};
	}, []);

	return (
		<div className="msigma-charts" ref={wrapRef}>
			{error ? (
				<p className="msigma-charts__error">{error}</p>
			) : (
				<>
					<div className="msigma-charts__row msigma-charts__row--full">
						<div ref={scatterRef} className="msigma-charts__plot" />
					</div>
					<div className="msigma-charts__row msigma-charts__row--full">
						<div ref={cornerRef} className="msigma-charts__plot" />
					</div>
					<div className="msigma-charts__row msigma-charts__row--full">
						<div ref={residualRef} className="msigma-charts__plot" />
					</div>
					<p className="msigma-charts__caption">{caption}</p>
				</>
			)}
		</div>
	);
}
