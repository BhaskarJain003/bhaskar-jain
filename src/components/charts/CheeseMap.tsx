/**
 * CheeseMap.tsx
 * =============
 * Subway-map style visualization of the cheese family, organized by
 * the processes applied to curd after coagulation.
 *
 * Eight branches: Acid-coagulated, Fresh/Unaged, Pasta Filata,
 * Soft-Ripened (Bloomy + Washed), Blue-Veined, Semi-Hard, Hard,
 * Extra-Hard/Grating, Processed.
 *
 * Two toggle overlays:
 *   • Milk type — borders each pill by the animal (cow/sheep/goat/buffalo)
 *   • Age       — recolors backgrounds on a fresh→ancient spectrum
 */

import { useState } from 'react';
import './CheeseMap.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type MilkKey = 'cow' | 'sheep' | 'goat' | 'buffalo' | 'mixed';
type AgeKey  = 'fresh' | 'weeks' | 'mo2to6' | 'mo6to18' | 'over18';
type GeoKey  = 'france' | 'italy' | 'england' | 'switzerland' | 'netherlands' |
               'spain' | 'usa' | 'denmark' | 'norway' | 'india' | 'universal';

interface Cheese {
  name:   string;
  milk:   MilkKey;
  age:    AgeKey;
  geo:    GeoKey;
  region: string;
}

interface CheeseGroup {
  name:  string;
  items: Cheese[];
}

interface CheeseBranch {
  name:   string;
  color:  string;
  icon:   string;
  desc:   string;
  items?:  Cheese[];
  groups?: CheeseGroup[];
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

const MILKS: Record<MilkKey, { label: string; color: string }> = {
  cow:     { label: 'Cow',     color: '#EF9A9A' },
  sheep:   { label: 'Sheep',   color: '#FFE082' },
  goat:    { label: 'Goat',    color: '#A5D6A7' },
  buffalo: { label: 'Buffalo', color: '#81D4FA' },
  mixed:   { label: 'Mixed',   color: '#CE93D8' },
};

const AGES: Record<AgeKey, { label: string; color: string }> = {
  fresh:   { label: 'Fresh (days)',   color: '#E3F2FD' },
  weeks:   { label: 'Weeks',         color: '#90CAF9' },
  mo2to6:  { label: '2–6 months',    color: '#42A5F5' },
  mo6to18: { label: '6–18 months',   color: '#1565C0' },
  over18:  { label: '18+ months',    color: '#0D2E6E' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const c = (
  name:   string,
  milk:   MilkKey,
  age:    AgeKey,
  geo:    GeoKey,
  region = '',
): Cheese => ({ name, milk, age, geo, region });

// ─── Data ─────────────────────────────────────────────────────────────────────

const CHEESE_DATA: CheeseBranch[] = [
  {
    name:  'Acid-coagulated',
    color: '#C07010',
    icon:  '🍋',
    desc:  'Acid (vinegar, lemon, citric) curdles milk without rennet; yields delicate, mild curds',
    items: [
      c('Ricotta',          'cow',    'fresh',   'italy',       'Italy'),
      c('Paneer',           'cow',    'fresh',   'india',       'India'),
      c('Queso Blanco',     'cow',    'fresh',   'universal',   'Latin America'),
      c('Mascarpone',       'cow',    'fresh',   'italy',       'Italy'),
      c('Quark',            'cow',    'fresh',   'universal',   'Central Europe'),
    ],
  },
  {
    name:  'Fresh / Unaged',
    color: '#E8B030',
    icon:  '🫙',
    desc:  'Rennet-set, drained but not pressed or ripened; eaten within days of making',
    items: [
      c('Cottage cheese',   'cow',    'fresh',   'universal',   ''),
      c('Cream cheese',     'cow',    'fresh',   'usa',         'USA'),
      c('Fromage frais',    'cow',    'fresh',   'france',      'France'),
      c('Chèvre (fresh)',   'goat',   'fresh',   'france',      'France'),
      c('Feta',             'sheep',  'weeks',   'universal',   'Greece'),
      c('Halloumi',         'mixed',  'weeks',   'universal',   'Cyprus'),
      c('Labneh',           'cow',    'weeks',   'universal',   'Middle East'),
    ],
  },
  {
    name:  'Pasta Filata',
    color: '#D07020',
    icon:  '🫸',
    desc:  'Curd heated and stretched in hot water — aligns protein strands, creates stringy elasticity',
    items: [
      c('Mozzarella (cow)',          'cow',     'fresh',  'italy',   'Italy'),
      c('Mozzarella di Bufala',      'buffalo', 'fresh',  'italy',   'Campania, Italy'),
      c('Burrata',                   'cow',     'fresh',  'italy',   'Puglia, Italy'),
      c('String cheese',             'cow',     'fresh',  'universal',''),
      c('Provolone (young)',          'cow',     'weeks',  'italy',   'Italy'),
      c('Scamorza',                  'cow',     'weeks',  'italy',   'Italy'),
      c('Caciocavallo',              'cow',     'mo2to6', 'italy',   'Southern Italy'),
      c('Provolone Valpadana (aged)','cow',     'mo6to18','italy',   'Italy'),
    ],
  },
  {
    name:  'Soft-Ripened',
    color: '#9B6CB0',
    icon:  '🍄',
    desc:  'Surface mold or bacteria ripen the cheese from outside in; texture softens toward center',
    groups: [
      {
        name:  'Bloomy rind (white Penicillium candidum)',
        items: [
          c('Brie',             'cow', 'weeks', 'france',  'Île-de-France'),
          c('Camembert',        'cow', 'weeks', 'france',  'Normandy'),
          c('Coulommiers',      'cow', 'weeks', 'france',  'France'),
          c('Brillat-Savarin',  'cow', 'weeks', 'france',  'France (triple cream)'),
          c('Explorateur',      'cow', 'weeks', 'france',  'France (triple cream)'),
        ],
      },
      {
        name:  'Washed rind (brine, beer, wine, or spirits)',
        items: [
          c('Taleggio',         'cow', 'weeks', 'italy',   'Lombardy, Italy'),
          c('Munster',          'cow', 'weeks', 'france',  'Alsace, France'),
          c('Époisses',         'cow', 'weeks', 'france',  'Burgundy, France'),
          c('Limburger',        'cow', 'weeks', 'universal','Belgium / Germany'),
          c('Stinking Bishop',  'cow', 'weeks', 'england', 'Gloucestershire, England'),
          c('Appenzeller',      'cow', 'mo2to6','switzerland','Switzerland'),
        ],
      },
    ],
  },
  {
    name:  'Blue-Veined',
    color: '#4060C0',
    icon:  '🔵',
    desc:  'Inoculated with Penicillium roqueforti, then needled to open air channels for mold to grow',
    items: [
      c('Roquefort',      'sheep', 'mo2to6',  'france',    'Combalou caves, France'),
      c('Gorgonzola',     'cow',   'mo2to6',  'italy',     'Piedmont / Lombardy'),
      c('Stilton',        'cow',   'mo2to6',  'england',   'Nottinghamshire, England'),
      c('Danablu',        'cow',   'mo2to6',  'denmark',   'Denmark'),
      c('Maytag Blue',    'cow',   'mo2to6',  'usa',       'Iowa, USA'),
      c('Cabrales',       'mixed', 'mo2to6',  'spain',     'Asturias, Spain'),
    ],
  },
  {
    name:  'Semi-Hard',
    color: '#4A8A30',
    icon:  '🧱',
    desc:  'Pressed to expel whey, aged 2–6 months; smooth paste, mild to medium flavour',
    items: [
      c('Gouda',          'cow', 'mo2to6',  'netherlands', 'Netherlands'),
      c('Edam',           'cow', 'mo2to6',  'netherlands', 'Netherlands'),
      c('Havarti',        'cow', 'mo2to6',  'denmark',     'Denmark'),
      c('Jarlsberg',      'cow', 'mo2to6',  'norway',      'Norway'),
      c('Raclette',       'cow', 'mo2to6',  'switzerland', 'Switzerland / France'),
      c('Fontina',        'cow', 'mo2to6',  'italy',       'Aosta Valley, Italy'),
      c('Colby',          'cow', 'mo2to6',  'usa',         'USA'),
      c('Monterey Jack',  'cow', 'mo2to6',  'usa',         'California, USA'),
    ],
  },
  {
    name:  'Hard',
    color: '#7A5010',
    icon:  '🪨',
    desc:  'Firmly pressed and aged 6–18 months; complex flavour, firm paste, crystalline texture developing',
    items: [
      c('Cheddar',        'cow',   'mo6to18', 'england',     'Somerset, England'),
      c('Gruyère',        'cow',   'mo6to18', 'switzerland', 'Fribourg, Switzerland'),
      c('Emmental',       'cow',   'mo6to18', 'switzerland', 'Switzerland'),
      c('Comté',          'cow',   'mo6to18', 'france',      'Jura, France'),
      c('Manchego',       'sheep', 'mo6to18', 'spain',       'La Mancha, Spain'),
      c('Beaufort',       'cow',   'mo6to18', 'france',      'Savoie, France'),
      c('Aged Gouda',     'cow',   'mo6to18', 'netherlands', 'Netherlands'),
      c('Idiazabal',      'sheep', 'mo6to18', 'spain',       'Basque Country, Spain'),
    ],
  },
  {
    name:  'Extra-Hard / Grating',
    color: '#5A3008',
    icon:  '✨',
    desc:  'Aged 18 months to 4+ years; very low moisture, intensely savoury, used grated or in shards',
    items: [
      c('Parmigiano-Reggiano', 'cow',   'over18', 'italy',  'Emilia-Romagna, Italy'),
      c('Pecorino Romano',     'sheep', 'over18', 'italy',  'Sardinia / Lazio, Italy'),
      c('Grana Padano',        'cow',   'over18', 'italy',  'Po Valley, Italy'),
      c('Aged Asiago',         'cow',   'over18', 'italy',  'Veneto, Italy'),
      c('Aged Manchego',       'sheep', 'over18', 'spain',  'La Mancha, Spain'),
      c('Mimolette (extra)',   'cow',   'over18', 'france', 'Flanders, France'),
    ],
  },
  {
    name:  'Processed / Analog',
    color: '#7A7A7A',
    icon:  '🏭',
    desc:  'Natural cheese blended with emulsifying salts and other dairy; consistent melt, long shelf life',
    items: [
      c('American cheese',     'cow', 'fresh', 'usa',       'USA'),
      c('Velveeta',            'cow', 'fresh', 'usa',       'USA'),
      c('Laughing Cow',        'cow', 'fresh', 'france',    'France'),
      c('Babybel',             'cow', 'weeks', 'france',    'France'),
      c('Spreadable cheese',   'cow', 'fresh', 'universal', ''),
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheesePill({
  cheese,
  branchColor,
  milkOn,
  ageOn,
}: {
  cheese:      Cheese;
  branchColor: string;
  milkOn:      boolean;
  ageOn:       boolean;
}) {
  const milkColor = MILKS[cheese.milk].color;
  const ageColor  = AGES[cheese.age].color;
  const bg        = ageOn
    ? hexToRgba(ageColor, 0.55)
    : hexToRgba(branchColor, 0.12);

  return (
    <span
      className="cm-prod"
      style={{
        background:  bg,
        borderColor: milkOn ? milkColor : 'transparent',
        color:       ageOn && cheese.age === 'over18' ? '#fff' : undefined,
      }}
      title={cheese.region || undefined}
    >
      {cheese.name}
      {cheese.region && (
        <span className="cm-region-tag">{cheese.region}</span>
      )}
    </span>
  );
}

function CheeseProducts({
  items,
  branchColor,
  milkOn,
  ageOn,
}: {
  items:       Cheese[];
  branchColor: string;
  milkOn:      boolean;
  ageOn:       boolean;
}) {
  return (
    <div className="cm-prods">
      {items.map((ch, j) => (
        <CheesePill
          key={j}
          cheese={ch}
          branchColor={branchColor}
          milkOn={milkOn}
          ageOn={ageOn}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CheeseMap() {
  const [open,   setOpen]   = useState<Set<number>>(new Set([0, 1, 2]));
  const [milkOn, setMilkOn] = useState(false);
  const [ageOn,  setAgeOn]  = useState(false);

  const toggleBranch = (i: number) =>
    setOpen(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const countItems = (b: CheeseBranch) =>
    b.items?.length ?? b.groups!.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="cm-wrap">
      {/* Overlay toggles */}
      <div className="cm-controls">
        <div className="cm-overlays">
          <button
            className={`cm-btn${milkOn ? ' active' : ''}`}
            onClick={() => setMilkOn(v => !v)}
          >
            Milk type
          </button>
          <button
            className={`cm-btn${ageOn ? ' active' : ''}`}
            onClick={() => setAgeOn(v => !v)}
          >
            Age
          </button>
        </div>
      </div>

      {/* Root */}
      <div className="cm-root">🧀 CHEESE</div>
      <div className="cm-trunk" />

      {/* Branches */}
      <div className="cm-branches">
        {CHEESE_DATA.map((branch, i) => {
          const isOpen     = open.has(i);
          const bodyBorder = hexToRgba(branch.color, 0.25);

          return (
            <div key={i} className="cm-branch" style={{ '--bc': branch.color } as React.CSSProperties}>
              <div
                className="cm-bh"
                onClick={() => toggleBranch(i)}
                title={branch.desc}
              >
                <div className="cm-dot" />
                <span className="cm-bn">{branch.icon} {branch.name}</span>
                <span className="cm-bcount">{countItems(branch)}</span>
                <span className={`cm-arrow${isOpen ? ' open' : ''}`}>▶</span>
              </div>

              <div
                className="cm-body"
                style={{
                  maxHeight:  isOpen ? '800px' : '0',
                  borderLeft: `2px solid ${bodyBorder}`,
                }}
              >
                {branch.groups
                  ? branch.groups.map((g, gi) => (
                      <div key={gi}>
                        <div className="cm-sg" style={{ color: branch.color }}>
                          ▸ {g.name}
                        </div>
                        <CheeseProducts
                          items={g.items}
                          branchColor={branch.color}
                          milkOn={milkOn}
                          ageOn={ageOn}
                        />
                      </div>
                    ))
                  : branch.items && (
                      <CheeseProducts
                        items={branch.items}
                        branchColor={branch.color}
                        milkOn={milkOn}
                        ageOn={ageOn}
                      />
                    )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legends */}
      {(milkOn || ageOn) && (
        <div className="cm-legends">
          {milkOn && (
            <div className="cm-legend-row">
              <span className="cm-leg-label">MILK →</span>
              {Object.entries(MILKS).map(([k, v]) => (
                <span key={k} className="cm-leg-item">
                  <span className="cm-leg-dot" style={{ background: v.color }} />
                  {v.label}
                </span>
              ))}
            </div>
          )}
          {ageOn && (
            <div className="cm-legend-row">
              <span className="cm-leg-label">AGE →</span>
              {Object.entries(AGES).map(([k, v]) => (
                <span key={k} className="cm-leg-item">
                  <span
                    className="cm-leg-swatch"
                    style={{
                      background: v.color,
                      border: '1px solid #d1d5db',
                    }}
                  />
                  {v.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
