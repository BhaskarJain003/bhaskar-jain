/**
 * BiasedCoinViz.tsx
 * =================
 * Interactive visualization for the Von Neumann biased-coin trick.
 *
 * Three linked visualizations, all driven by a single p slider:
 *  1. Punnett square — shows the four double-flip outcomes proportionally
 *  2. P(result in one round) = 2p(1-p) — probability curve
 *  3. E[rounds] = 1/(2p(1-p)) — expected rounds curve
 *
 * All rendering is pure SVG + React state; no external chart libraries.
 */

import { useState } from 'react';
import './BiasedCoinViz.css';

// ─── Colors ────────────────────────────────────────────────────────────────────

const C_RESULT_FILL   = '#3b82f6';   // blue-500
const C_RESULT_STROKE = '#1d4ed8';   // blue-700
const C_RESULT_TEXT   = '#1e3a8a';   // blue-900
const C_NOPE_FILL     = '#f1f5f9';   // slate-100
const C_NOPE_STROKE   = '#94a3b8';   // slate-400
const C_NOPE_TEXT     = '#64748b';   // slate-500
const C_CURVE         = '#1d4ed8';   // blue-700
const C_DOT           = '#e63946';   // red
const C_AXIS          = '#475569';   // slate-600
const C_GRID          = '#e2e8f0';   // slate-200

// ─── Math helpers ──────────────────────────────────────────────────────────────

function probResult(p: number): number  { return 2 * p * (1 - p); }
function expRounds(p: number):  number  {
  const pr = probResult(p);
  return pr > 0 ? 1 / pr : Infinity;
}

const f2 = (v: number) => v.toFixed(2);
const f3 = (v: number) => v.toFixed(3);

// ─── Chart layout constants ────────────────────────────────────────────────────

const CW = 380, CH = 212;          // chart SVG viewBox dimensions
const MT = 22,  MR = 15, MB = 50, ML = 50;
const PW = CW - ML - MR;           // plot width  = 315
const PH = CH - MT - MB;           // plot height = 140

function xs(x: number):               number { return ML + x * PW; }
function ys(y: number, yMax: number): number { return MT + PH - (y / yMax) * PH; }

/**
 * Build an SVG path string for a function over x ∈ [0.003, 0.997].
 * Values can exceed yMax — the caller's clipPath cuts them off.
 */
function buildPath(fn: (x: number) => number, yMax: number): string {
  const parts: string[] = [];
  const N = 400;
  let pen = false;
  for (let i = 0; i <= N; i++) {
    const x = 0.003 + 0.994 * (i / N);
    const y = fn(x);
    if (!isFinite(y) || isNaN(y) || y < 0) { pen = false; continue; }
    parts.push(`${pen ? 'L' : 'M'} ${xs(x).toFixed(1)} ${ys(y, yMax).toFixed(1)}`);
    pen = true;
  }
  return parts.join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PUNNETT SQUARE
// ─────────────────────────────────────────────────────────────────────────────

const SQ   = 300;   // square inner size (px in viewBox coords)
const PML  = 108;   // left margin for row labels
const PMT  = 68;    // top margin for column labels
const PMR  = 108;   // right margin — matches PML so the square is centred in the viewBox
const PMB  = 50;    // bottom margin for "equal area" note
const PVW  = SQ + PML + PMR;   // 516
const PVH  = SQ + PMT + PMB;   // 418

function PunnettSquare({ p }: { p: number }) {
  const q   = 1 - p;
  const pW  = SQ * p,  qW = SQ * q;
  const pH  = SQ * p,  qH = SQ * q;
  const ox  = PML,     oy = PMT;

  // Cell centers
  const cxHH = ox + pW / 2,       cyHH = oy + pH / 2;
  const cxHT = ox + pW + qW / 2,  cyHT = oy + pH / 2;
  const cxTH = ox + pW / 2,       cyTH = oy + pH + qH / 2;
  const cxTT = ox + pW + qW / 2,  cyTT = oy + pH + qH / 2;

  const MIN_TEXT = 52;    // cell must be at least this wide AND tall to show any text
  const MIN_FULL = 88;    // cell must reach this size in both dims for all 3 lines

  // Adaptive font sizes — shrink for small cells, cap for large
  const fs  = (w: number, h: number) => Math.max(8,   Math.min(13.5, w * 0.14, h * 0.17));
  const fss = (w: number, h: number) => Math.max(7,   Math.min(10.5, w * 0.10, h * 0.13));

  // Axis label visibility thresholds
  const showCH = pW >= 62;   // "2nd flip: H" column header
  const showCT = qW >= 62;
  const showRH = pH >= 35;   // "1st: H" row header
  const showRT = qH >= 35;

  return (
    <svg
      viewBox={`0 0 ${PVW} ${PVH}`}
      className="bcv-svg"
      aria-label="Punnett square showing biased coin double-flip probabilities"
    >
      {/* ── 4 cells ──────────────────────────────────────────────── */}
      <rect x={ox}      y={oy}      width={pW} height={pH} fill={C_NOPE_FILL}   stroke={C_NOPE_STROKE}   strokeWidth={1.5} />
      <rect x={ox + pW} y={oy}      width={qW} height={pH} fill={C_RESULT_FILL} stroke={C_RESULT_STROKE} strokeWidth={2.5} />
      <rect x={ox}      y={oy + pH} width={pW} height={qH} fill={C_RESULT_FILL} stroke={C_RESULT_STROKE} strokeWidth={2.5} />
      <rect x={ox + pW} y={oy + pH} width={qW} height={qH} fill={C_NOPE_FILL}   stroke={C_NOPE_STROKE}   strokeWidth={1.5} />

      {/* ── Outer border & dividers ───────────────────────────────── */}
      <rect x={ox} y={oy} width={SQ} height={SQ} fill="none" stroke={C_AXIS} strokeWidth={2} />
      <line x1={ox + pW} y1={oy}      x2={ox + pW} y2={oy + SQ} stroke={C_AXIS} strokeWidth={1.5} />
      <line x1={ox}      y1={oy + pH} x2={ox + SQ} y2={oy + pH} stroke={C_AXIS} strokeWidth={1.5} />

      {/* ── HH text ──────────────────────────────────────────────── */}
      {pW >= MIN_TEXT && pH >= MIN_TEXT && (
        <>
          <text x={cxHH} y={cyHH - (pW >= MIN_FULL && pH >= MIN_FULL ? 9 : 4)}
            textAnchor="middle" fontSize={fs(pW, pH)} fontWeight="600" fill={C_NOPE_TEXT}>HH</text>
          <text x={cxHH} y={cyHH + 7}
            textAnchor="middle" fontSize={fss(pW, pH)} fill={C_NOPE_TEXT}>p² = {f3(p * p)}</text>
          {pW >= MIN_FULL && pH >= MIN_FULL && (
            <text x={cxHH} y={cyHH + 19}
              textAnchor="middle" fontSize={Math.max(7, fss(pW, pH) - 1)} fill={C_NOPE_TEXT} fontStyle="italic">no result – redo</text>
          )}
        </>
      )}

      {/* ── HT text ──────────────────────────────────────────────── */}
      {qW >= MIN_TEXT && pH >= MIN_TEXT && (
        <>
          <text x={cxHT} y={cyHT - 9}
            textAnchor="middle" fontSize={fs(qW, pH)} fontWeight="700" fill={C_RESULT_TEXT}>HT ✓</text>
          <text x={cxHT} y={cyHT + 4}
            textAnchor="middle" fontSize={fss(qW, pH)} fill={C_RESULT_TEXT}>p·q = {f3(p * q)}</text>
          {qW >= MIN_FULL && pH >= MIN_FULL && (
            <text x={cxHT} y={cyHT + 16}
              textAnchor="middle" fontSize={Math.max(7, fss(qW, pH) - 1)} fill={C_RESULT_TEXT} fontStyle="italic">result = Heads</text>
          )}
        </>
      )}

      {/* ── TH text ──────────────────────────────────────────────── */}
      {pW >= MIN_TEXT && qH >= MIN_TEXT && (
        <>
          <text x={cxTH} y={cyTH - 9}
            textAnchor="middle" fontSize={fs(pW, qH)} fontWeight="700" fill={C_RESULT_TEXT}>TH ✓</text>
          <text x={cxTH} y={cyTH + 4}
            textAnchor="middle" fontSize={fss(pW, qH)} fill={C_RESULT_TEXT}>q·p = {f3(q * p)}</text>
          {pW >= MIN_FULL && qH >= MIN_FULL && (
            <text x={cxTH} y={cyTH + 16}
              textAnchor="middle" fontSize={Math.max(7, fss(pW, qH) - 1)} fill={C_RESULT_TEXT} fontStyle="italic">result = Tails</text>
          )}
        </>
      )}

      {/* ── TT text ──────────────────────────────────────────────── */}
      {qW >= MIN_TEXT && qH >= MIN_TEXT && (
        <>
          <text x={cxTT} y={cyTT - (qW >= MIN_FULL && qH >= MIN_FULL ? 9 : 4)}
            textAnchor="middle" fontSize={fs(qW, qH)} fontWeight="600" fill={C_NOPE_TEXT}>TT</text>
          <text x={cxTT} y={cyTT + 7}
            textAnchor="middle" fontSize={fss(qW, qH)} fill={C_NOPE_TEXT}>q² = {f3(q * q)}</text>
          {qW >= MIN_FULL && qH >= MIN_FULL && (
            <text x={cxTT} y={cyTT + 19}
              textAnchor="middle" fontSize={Math.max(7, fss(qW, qH) - 1)} fill={C_NOPE_TEXT} fontStyle="italic">no result – redo</text>
          )}
        </>
      )}

      {/* ── Column headers ───────────────────────────────────────── */}
      {showCH && (
        <>
          <text x={ox + pW / 2} y={oy - 38}
            textAnchor="middle" fontSize={11} fontWeight="600" fill={C_AXIS}>2nd flip: H</text>
          <text x={ox + pW / 2} y={oy - 24}
            textAnchor="middle" fontSize={9} fill={C_AXIS}>width = p = {f2(p)}</text>
          <line x1={ox} y1={oy - 14} x2={ox + pW} y2={oy - 14}
            stroke={C_AXIS} strokeWidth={0.8} strokeDasharray="3,2" />
        </>
      )}
      {showCT && (
        <>
          <text x={ox + pW + qW / 2} y={oy - 38}
            textAnchor="middle" fontSize={11} fontWeight="600" fill={C_AXIS}>2nd flip: T</text>
          <text x={ox + pW + qW / 2} y={oy - 24}
            textAnchor="middle" fontSize={9} fill={C_AXIS}>width = q = {f2(q)}</text>
          <line x1={ox + pW} y1={oy - 14} x2={ox + SQ} y2={oy - 14}
            stroke={C_AXIS} strokeWidth={0.8} strokeDasharray="3,2" />
        </>
      )}

      {/* ── Row headers ──────────────────────────────────────────── */}
      {showRH && (
        <>
          <text x={ox - 8} y={oy + pH / 2 - 6}
            textAnchor="end" fontSize={11} fontWeight="600" fill={C_AXIS}>1st: H</text>
          <text x={ox - 8} y={oy + pH / 2 + 7}
            textAnchor="end" fontSize={9} fill={C_AXIS}>h = {f2(p)}</text>
        </>
      )}
      {showRT && (
        <>
          <text x={ox - 8} y={oy + pH + qH / 2 - 6}
            textAnchor="end" fontSize={11} fontWeight="600" fill={C_AXIS}>1st: T</text>
          <text x={ox - 8} y={oy + pH + qH / 2 + 7}
            textAnchor="end" fontSize={9} fill={C_AXIS}>h = {f2(q)}</text>
        </>
      )}

      {/* ── Equal-area annotation ────────────────────────────────── */}
      <text x={PVW / 2} y={oy + SQ + 22}
        textAnchor="middle" fontSize={11} fontWeight="600" fill={C_RESULT_TEXT}>
        Area(HT) = p·q = {f3(p * q)} = q·p = Area(TH) — always equal
      </text>
      <text x={PVW / 2} y={oy + SQ + 37}
        textAnchor="middle" fontSize={9.5} fill={C_AXIS}>
        Different shapes, different outcomes, but identical probability — for any p.
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PROBABILITY CURVE  P(result) = 2p(1-p)
// ─────────────────────────────────────────────────────────────────────────────

function ProbabilityChart({ p }: { p: number }) {
  const yMax   = 1.0;
  const yTicks = [0.1, 0.2, 0.3, 0.4, 0.5];
  const xTicks = [0, 0.25, 0.5, 0.75, 1.0];
  const path   = buildPath(probResult, yMax);
  const currY  = probResult(p);
  const dotX   = xs(p);
  const dotY   = ys(currY, yMax);
  const labelRight = p > 0.62;

  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className="bcv-svg-chart">
      <defs>
        <clipPath id="bcv-clip-prob">
          <rect x={ML} y={MT} width={PW} height={PH} />
        </clipPath>
      </defs>

      {/* Grid */}
      {yTicks.map(t => (
        <line key={t} x1={ML} y1={ys(t, yMax)} x2={ML + PW} y2={ys(t, yMax)}
          stroke={C_GRID} strokeWidth={1} />
      ))}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={xs(t)} y1={MT} x2={xs(t)} y2={MT + PH}
          stroke={C_GRID} strokeWidth={1} />
      ))}

      {/* Curve */}
      <path d={path} fill="none" stroke={C_CURVE} strokeWidth={2.5}
        clipPath="url(#bcv-clip-prob)" />

      {/* Axes */}
      <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} stroke={C_AXIS} strokeWidth={1.5} />
      <line x1={ML} y1={MT}      x2={ML}       y2={MT + PH} stroke={C_AXIS} strokeWidth={1.5} />

      {/* X ticks + labels */}
      {xTicks.map(t => (
        <g key={t}>
          <line x1={xs(t)} y1={MT + PH} x2={xs(t)} y2={MT + PH + 5} stroke={C_AXIS} strokeWidth={1} />
          <text x={xs(t)} y={MT + PH + 15} textAnchor="middle" fontSize={9} fill={C_AXIS}>{t}</text>
        </g>
      ))}

      {/* Y ticks + labels */}
      {[0, ...yTicks].map(t => (
        <g key={t}>
          <line x1={ML - 5} y1={ys(t, yMax)} x2={ML} y2={ys(t, yMax)} stroke={C_AXIS} strokeWidth={1} />
          <text x={ML - 8} y={ys(t, yMax) + 3.5} textAnchor="end" fontSize={9} fill={C_AXIS}>{t}</text>
        </g>
      ))}

      {/* Axis labels */}
      <text x={ML + PW / 2} y={CH - 6} textAnchor="middle" fontSize={10.5} fill={C_AXIS}>
        p (probability of Heads)
      </text>
      <text
        x={14} y={MT + PH / 2}
        textAnchor="middle" fontSize={10} fill={C_AXIS}
        transform={`rotate(-90, 14, ${MT + PH / 2})`}
      >
        P(result in 1 round)
      </text>

      {/* Red dot */}
      <circle cx={dotX} cy={dotY} r={6} fill={C_DOT} stroke="white" strokeWidth={1.5} />
      <text
        x={dotX + (labelRight ? -11 : 11)}
        y={dotY - 9}
        textAnchor={labelRight ? 'end' : 'start'}
        fontSize={9.5} fill={C_DOT} fontWeight="600"
      >
        {currY.toFixed(3)}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXPECTED ROUNDS  E[rounds] = 1/(2p(1-p))
// ─────────────────────────────────────────────────────────────────────────────

function ExpectedRoundsChart({ p }: { p: number }) {
  const yMax   = 15;
  const yTicks = [2, 4, 6, 8, 10, 12, 14];
  const xTicks = [0, 0.25, 0.5, 0.75, 1.0];
  const path   = buildPath(expRounds, yMax);
  const currE  = expRounds(p);
  const clampE = Math.min(currE, yMax);
  const isOff  = currE > yMax;
  const dotX   = xs(p);
  const dotY   = ys(clampE, yMax);
  const labelRight = p > 0.62;

  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className="bcv-svg-chart">
      <defs>
        <clipPath id="bcv-clip-rounds">
          <rect x={ML} y={MT} width={PW} height={PH} />
        </clipPath>
      </defs>

      {/* Grid */}
      {yTicks.map(t => (
        <line key={t} x1={ML} y1={ys(t, yMax)} x2={ML + PW} y2={ys(t, yMax)}
          stroke={C_GRID} strokeWidth={1} />
      ))}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={xs(t)} y1={MT} x2={xs(t)} y2={MT + PH}
          stroke={C_GRID} strokeWidth={1} />
      ))}

      {/* Curve */}
      <path d={path} fill="none" stroke={C_CURVE} strokeWidth={2.5}
        clipPath="url(#bcv-clip-rounds)" />

      {/* Axes */}
      <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} stroke={C_AXIS} strokeWidth={1.5} />
      <line x1={ML} y1={MT}      x2={ML}       y2={MT + PH} stroke={C_AXIS} strokeWidth={1.5} />

      {/* X ticks */}
      {xTicks.map(t => (
        <g key={t}>
          <line x1={xs(t)} y1={MT + PH} x2={xs(t)} y2={MT + PH + 5} stroke={C_AXIS} strokeWidth={1} />
          <text x={xs(t)} y={MT + PH + 15} textAnchor="middle" fontSize={9} fill={C_AXIS}>{t}</text>
        </g>
      ))}

      {/* Y ticks */}
      {[0, ...yTicks].map(t => (
        <g key={t}>
          <line x1={ML - 5} y1={ys(t, yMax)} x2={ML} y2={ys(t, yMax)} stroke={C_AXIS} strokeWidth={1} />
          <text x={ML - 8} y={ys(t, yMax) + 3.5} textAnchor="end" fontSize={9} fill={C_AXIS}>{t}</text>
        </g>
      ))}

      {/* Axis labels */}
      <text x={ML + PW / 2} y={CH - 6} textAnchor="middle" fontSize={10.5} fill={C_AXIS}>
        p (probability of Heads)
      </text>
      <text
        x={14} y={MT + PH / 2}
        textAnchor="middle" fontSize={10} fill={C_AXIS}
        transform={`rotate(-90, 14, ${MT + PH / 2})`}
      >
        Expected rounds
      </text>

      {/* Off-chart indicator */}
      {isOff && (
        <text x={dotX} y={MT - 4} textAnchor="middle" fontSize={8} fill={C_DOT}>
          ↑ {currE.toFixed(1)}
        </text>
      )}

      {/* Red dot */}
      <circle cx={dotX} cy={dotY} r={6} fill={C_DOT} stroke="white" strokeWidth={1.5} />
      <text
        x={dotX + (labelRight ? -11 : 11)}
        y={dotY - 9}
        textAnchor={labelRight ? 'end' : 'start'}
        fontSize={9.5} fill={C_DOT} fontWeight="600"
      >
        {isFinite(currE) ? (isOff ? `>${yMax}` : currE.toFixed(2)) : '∞'}
      </text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function BiasedCoinViz() {
  const [p, setP] = useState(0.7);
  const q  = 1 - p;
  const pr = probResult(p);
  const er = expRounds(p);

  return (
    <div className="bcv-outer">

      {/* ── Stats strip ────────────────────────────────────────────── */}
      <div className="bcv-stats">
        <div className="bcv-stat">
          <div className="bcv-stat-label">P(result in 1 round)</div>
          <div className="bcv-stat-value">{pr.toFixed(4)}</div>
          <div className="bcv-stat-sub">= 2pq = 2 × {f2(p)} × {f2(q)}</div>
        </div>
        <div className="bcv-stat">
          <div className="bcv-stat-label">Expected rounds</div>
          <div className="bcv-stat-value">{isFinite(er) ? er.toFixed(2) : '∞'}</div>
          <div className="bcv-stat-sub">= 1 / (2pq)</div>
        </div>
        <div className="bcv-stat">
          <div className="bcv-stat-label">HT = TH = p·q</div>
          <div className="bcv-stat-value">{(p * q).toFixed(4)}</div>
          <div className="bcv-stat-sub">always exactly equal</div>
        </div>
      </div>

      {/* ── Global slider ──────────────────────────────────────────── */}
      <div className="bcv-slider-wrapper">
        <div className="bcv-slider-header">
          <span className="bcv-slider-title">
            Coin bias — <strong>p = {p.toFixed(2)}</strong>
          </span>
          <span className="bcv-slider-sub">q = 1 − p = {q.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.01} max={0.99} step={0.01}
          value={p}
          onChange={e => setP(Number(e.target.value))}
          className="bcv-range"
          aria-label="Coin bias p"
        />
        <div className="bcv-slider-ends">
          <span>← T-heavy (p small)</span>
          <span>Fair (p = 0.5)</span>
          <span>H-heavy (p large) →</span>
        </div>
      </div>

      {/* ── Punnett Square ─────────────────────────────────────────── */}
      <div className="bcv-section">
        <div className="bcv-section-label">The Punnett Square</div>
        <p className="bcv-section-note">
          Each cell's area equals its probability. Blue cells (HT and TH) are the
          usable outcomes — watch how they change shape as you drag p, yet always
          cover exactly the same area.
        </p>
        <PunnettSquare p={p} />
      </div>

      {/* ── Two charts ─────────────────────────────────────────────── */}
      <div className="bcv-charts">
        <div className="bcv-section">
          <div className="bcv-section-label">P(result in first round) = 2p(1−p)</div>
          <p className="bcv-section-note">
            Peaks at 50% when the coin is perfectly fair. The more biased the coin,
            the more likely each double-toss produces a wasted HH or TT.
          </p>
          <ProbabilityChart p={p} />
        </div>
        <div className="bcv-section">
          <div className="bcv-section-label">Expected rounds = 1 / (2p(1−p))</div>
          <p className="bcv-section-note">
            Minimum of 2 rounds at p = 0.5. Grows rapidly at the extremes.
            Y-axis capped at 15; the curve diverges to ∞ as p → 0 or p → 1.
          </p>
          <ExpectedRoundsChart p={p} />
        </div>
      </div>

    </div>
  );
}
