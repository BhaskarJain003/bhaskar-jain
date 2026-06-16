/**
 * AsteroidStat.tsx
 * ================
 * Tiny inline island that renders a single build-current number pulled straight
 * from the same /thoughts/asteroid-mining/asteroid-data.json the interactive
 * model loads. Use it inside the prose so that figures (object count, taxonomy
 * coverage, etc.) can never drift out of sync with the dataset when the data is
 * rebuilt — the number is always read from the file, never hardcoded.
 *
 * Usage in MDX:
 *   <AsteroidStat stat="count" client:visible />          → e.g. "845"
 *   <AsteroidStat stat="unknownPct" client:visible />     → e.g. "79%"
 *   <AsteroidStat stat="classifiedPct" client:visible />  → e.g. "21%"
 *
 * The `fallback` prop is shown until the fetch resolves (and if it fails), so
 * the sentence still reads sensibly during load / SSR.
 */
import { useEffect, useState } from 'react';

interface FamCounts { [k: string]: number }
interface Meta {
  count?: number;
  fam_counts?: FamCounts;
  taxonomy_sources?: {
    tier1_sbdb_spectral?: number;
    tier2_mithneos_nir?: number;
    tier3_neese_compilation?: number;
    tier4_sdss_photometric?: number;
    tier5_unknown?: number;
  };
  dv_stats_km_s?: {
    min?: number;
    p10?: number;
    median?: number;
    p90?: number;
    max?: number;
  };
}

/** Every value here is derived from the dataset, so the prose tracks the data. */
type StatKey =
  | 'count'           // number of NEAs the model actually uses (post all filters)
  | 'unknown'         // count of unclassified-family objects
  | 'classified'      // count of objects with a taxonomy assignment
  | 'unknownPct'      // % of the working set with no taxonomy
  | 'classifiedPct'   // % of the working set with a taxonomy
  | 'extraTaxonomy'   // objects classified by MITHNEOS + Neese + SDSS beyond SBDB
  | 'dvMin'           // lowest outbound Δv in the catalog [km/s]
  | 'dvMedian'        // median outbound Δv [km/s]
  | 'dvMax';          // Δv cutoff actually realised in the data [km/s]

function compute(stat: StatKey, meta: Meta, total: number): string {
  const fc = meta.fam_counts ?? {};
  const unknown = fc['3'] ?? 0;
  const classified = Math.max(0, total - unknown);
  const ts = meta.taxonomy_sources;
  const dv = meta.dv_stats_km_s ?? {};
  const km = (v?: number) => (typeof v === 'number' ? `${v.toFixed(1)} km/s` : '—');
  switch (stat) {
    case 'count':         return total.toLocaleString();
    case 'unknown':       return unknown.toLocaleString();
    case 'classified':    return classified.toLocaleString();
    case 'unknownPct':    return total > 0 ? `${Math.round((unknown / total) * 100)}%` : '—';
    case 'classifiedPct': return total > 0 ? `${Math.round((classified / total) * 100)}%` : '—';
    case 'extraTaxonomy':
      return ts
        ? ((ts.tier2_mithneos_nir ?? 0) + (ts.tier3_neese_compilation ?? 0) + (ts.tier4_sdss_photometric ?? 0)).toLocaleString()
        : '—';
    case 'dvMin':         return km(dv.min);
    case 'dvMedian':      return km(dv.median);
    case 'dvMax':         return km(dv.max);
    default:              return '—';
  }
}

export default function AsteroidStat({ stat, fallback }: { stat: StatKey; fallback?: string }) {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/thoughts/asteroid-mining/asteroid-data.json')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { asteroids?: unknown[]; meta?: Meta }) => {
        if (!alive) return;
        const meta = d.meta ?? {};
        const total = d.asteroids?.length ?? meta.count ?? 0;
        setValue(compute(stat, meta, total));
      })
      .catch(() => { if (alive) setValue(null); });
    return () => { alive = false; };
  }, [stat]);

  return <>{value ?? fallback ?? '…'}</>;
}
