/**
 * DairyProcessMap.tsx
 * ===================
 * Interactive subway-map style visualization of dairy products organized
 * by the transformation applied to milk.
 *
 * Six branches: Fat Separation, Fermented, Coagulated, Concentrated,
 * Frozen, Cooked / Sweetened.
 *
 * Two toggle overlays:
 *   • Texture  — borders each pill with a color on the liquid→powder spectrum
 *   • Geography — recolors pill backgrounds by region of origin
 */

import { useState } from 'react';
import './DairyProcessMap.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type TextureKey  = 'liquid' | 'drinkable' | 'spoonable' | 'spreadable' | 'sliceable' | 'solid' | 'powder';
type GeoKey      = 'universal' | 'europe' | 'southasia' | 'caucasus' | 'latam' | 'eastasia' | 'middleeast';

interface Product {
  name:    string;
  texture: TextureKey;
  region:  string;
  geo:     GeoKey;
}

interface SubGroup {
  name:  string;
  items: Product[];
}

interface Branch {
  name:   string;
  color:  string;
  icon:   string;
  desc:   string;
  items?:  Product[];
  groups?: SubGroup[];
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

const TEXTURES: Record<TextureKey, { label: string; color: string }> = {
  liquid:     { label: 'Liquid',     color: '#90CAF9' },
  drinkable:  { label: 'Drinkable',  color: '#5B9BD5' },
  spoonable:  { label: 'Spoonable',  color: '#4DB6AC' },
  spreadable: { label: 'Spreadable', color: '#81C784' },
  sliceable:  { label: 'Sliceable',  color: '#FFD54F' },
  solid:      { label: 'Solid',      color: '#FF8A65' },
  powder:     { label: 'Powder',     color: '#A1887F' },
};

const GEOS: Record<GeoKey, { label: string; color: string }> = {
  universal:  { label: 'Universal',               color: '#9E9E9E' },
  europe:     { label: 'Europe',                  color: '#5C6BC0' },
  southasia:  { label: 'South Asia',              color: '#F57C00' },
  caucasus:   { label: 'Caucasus / Central Asia', color: '#7CB342' },
  latam:      { label: 'Latin America',           color: '#E91E63' },
  eastasia:   { label: 'East Asia',               color: '#E53935' },
  middleeast: { label: 'Middle East',             color: '#FF9800' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const p = (
  name:    string,
  texture: TextureKey,
  region = '',
  geo: GeoKey = 'universal',
): Product => ({ name, texture, region, geo });

// ─── Data ─────────────────────────────────────────────────────────────────────

const DATA: Branch[] = [
  {
    name:  'Fat Separation',
    color: '#C48A00',
    icon:  '🧈',
    desc:  'Centrifuge or gravity separates fat globules from skim milk',
    items: [
      p('Cream',                   'liquid'),
      p('Butter',                  'spreadable'),
      p('Ghee / clarified butter', 'liquid',     'India',       'southasia'),
      p('Buttermilk (traditional)','drinkable'),
      p('Kaymak',                  'spoonable',  'Turkey',      'middleeast'),
      p('Clotted cream',           'spoonable',  'England',     'europe'),
      p('Malai',                   'spoonable',  'India',       'southasia'),
    ],
  },
  {
    name:  'Fermented',
    color: '#2E9E52',
    icon:  '🫙',
    desc:  'Bacterial cultures convert lactose to lactic acid, lowering pH and thickening the milk',
    groups: [
      {
        name:  'Yogurt family',
        items: [
          p('Yogurt',         'spoonable'),
          p('Greek yogurt',   'spoonable', 'Greece',      'europe'),
          p('Skyr',           'spoonable', 'Iceland',     'europe'),
          p('Filmjölk',       'drinkable', 'Scandinavia', 'europe'),
          p('Viili',          'spoonable', 'Finland',     'europe'),
          p('Ymer',           'spoonable', 'Denmark',     'europe'),
          p('Matzoon',        'spoonable', 'Armenia',     'caucasus'),
          p('Dadiah',         'spoonable', 'Indonesia',   'eastasia'),
        ],
      },
      {
        name:  'Drinkable fermented',
        items: [
          p('Kefir',          'drinkable', 'Caucasus',      'caucasus'),
          p('Ayran',          'drinkable', 'Turkey',        'middleeast'),
          p('Doogh',          'drinkable', 'Iran',          'middleeast'),
          p('Lassi / chaas',  'drinkable', 'India',         'southasia'),
          p('Kumis',          'drinkable', 'Central Asia',  'caucasus'),
          p('Chal',           'drinkable', 'Turkmenistan',  'caucasus'),
          p('Blaand',         'drinkable', 'Scotland',      'europe'),
        ],
      },
      {
        name:  'Fermented cream',
        items: [
          p('Sour cream',     'spoonable'),
          p('Crème fraîche',  'spoonable', 'France',   'europe'),
          p('Smetana',        'spoonable', 'E. Europe', 'europe'),
          p('Ryazhenka',      'spoonable', 'Russia',    'europe'),
        ],
      },
      {
        name:  'Dried / preserved fermented',
        items: [
          p('Kashk / Qurut',  'solid',  'Middle East', 'middleeast'),
          p('Aarts',          'solid',  'Mongolia',    'eastasia'),
          p('Smen',           'solid',  'Morocco',     'middleeast'),
          p('Tarhana',        'powder', 'Turkey',      'middleeast'),
        ],
      },
    ],
  },
  {
    name:  'Coagulated / Curdled',
    color: '#CC5200',
    icon:  '🧀',
    desc:  'Rennet or acid precipitates casein proteins; whey drains away leaving curds',
    items: [
      p('Cottage cheese',         'spoonable'),
      p('Paneer',                 'sliceable', 'India',   'southasia'),
      p('Labneh',                 'spreadable','Lebanon', 'middleeast'),
      p('Ricotta',                'spoonable', 'Italy',   'europe'),
      p('Mozzarella',             'sliceable', 'Italy',   'europe'),
      p('Quark / fromage frais',  'spoonable', 'Europe',  'europe'),
      p('Cuajada',                'spoonable', 'Spain',   'europe'),
      p('Cheese (see map →)',     'solid'),
      p('Whey (by-product)',      'liquid'),
    ],
  },
  {
    name:  'Concentrated / Dried',
    color: '#6A3DB0',
    icon:  '🥫',
    desc:  'Water removed via prolonged heating or vacuum evaporation',
    items: [
      p('Evaporated milk',    'liquid'),
      p('Condensed milk',     'liquid'),
      p('Milk powder',        'powder'),
      p('Buttermilk powder',  'powder'),
      p('Khoa / khoya',       'solid',     'India',     'southasia'),
      p('Infant formula',     'powder'),
      p('Casein',             'powder'),
      p('Dulce de leche',     'spreadable','Argentina', 'latam'),
    ],
  },
  {
    name:  'Frozen',
    color: '#1278BE',
    icon:  '🍦',
    desc:  'Churned while freezing; ice crystals and air give smooth, creamy texture',
    items: [
      p('Ice cream',      'solid'),
      p('Gelato',         'solid', 'Italy',  'europe'),
      p('Kulfi',          'solid', 'India',  'southasia'),
      p('Frozen yogurt',  'solid'),
      p('Frozen custard', 'solid'),
      p('Dondurma',       'solid', 'Turkey', 'middleeast'),
      p('Soft serve',     'solid'),
      p('Booza',          'solid', 'Syria',  'middleeast'),
      p('Semifreddo',     'solid', 'Italy',  'europe'),
    ],
  },
  {
    name:  'Cooked / Sweetened',
    color: '#B02858',
    icon:  '🍮',
    desc:  'Prolonged heat browns sugars and denatures proteins; milk becomes richer than its parts',
    items: [
      p('Custard',               'spoonable'),
      p('Crème anglaise',        'liquid',    'France',  'europe'),
      p('Basundi',               'spoonable', 'India',   'southasia'),
      p('Shrikhand',             'spoonable', 'India',   'southasia'),
      p('Sütlaç / rice pudding', 'spoonable', 'Turkey',  'middleeast'),
      p('Eggnog',                'drinkable'),
      p('Junket',                'spoonable', 'England', 'europe'),
      p('Malaiyo',               'spoonable', 'India',   'southasia'),
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProductPill({
  product,
  branchColor,
  textureOn,
  geoOn,
}: {
  product:     Product;
  branchColor: string;
  textureOn:   boolean;
  geoOn:       boolean;
}) {
  const txColor  = TEXTURES[product.texture].color;
  const geoColor = GEOS[product.geo].color;
  const bg       = geoOn
    ? hexToRgba(geoColor, 0.18)
    : hexToRgba(branchColor, 0.12);

  return (
    <span
      className="dpm-prod"
      style={{ background: bg, borderColor: textureOn ? txColor : 'transparent' }}
      title={product.region || undefined}
    >
      {product.name}
      {geoOn && product.region && (
        <span className="dpm-geo-tag">{product.region}</span>
      )}
    </span>
  );
}

function Products({
  items,
  branchColor,
  textureOn,
  geoOn,
}: {
  items:       Product[];
  branchColor: string;
  textureOn:   boolean;
  geoOn:       boolean;
}) {
  return (
    <div className="dpm-prods">
      {items.map((item, j) => (
        <ProductPill
          key={j}
          product={item}
          branchColor={branchColor}
          textureOn={textureOn}
          geoOn={geoOn}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DairyProcessMap() {
  const [open,      setOpen]      = useState<Set<number>>(new Set([0, 1]));
  const [textureOn, setTextureOn] = useState(false);
  const [geoOn,     setGeoOn]     = useState(false);

  const toggleBranch = (i: number) =>
    setOpen(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const countItems = (b: Branch) =>
    b.items?.length ?? b.groups!.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="dpm-wrap">
      {/* Overlay toggles */}
      <div className="dpm-controls">
        <div className="dpm-overlays">
          <button
            className={`dpm-btn${textureOn ? ' active' : ''}`}
            onClick={() => setTextureOn(v => !v)}
          >
            Texture
          </button>
          <button
            className={`dpm-btn${geoOn ? ' active' : ''}`}
            onClick={() => setGeoOn(v => !v)}
          >
            Geography
          </button>
        </div>
      </div>

      {/* Root */}
      <div className="dpm-root">🥛 MILK</div>
      <div className="dpm-trunk" />

      {/* Branches */}
      <div className="dpm-branches">
        {DATA.map((branch, i) => {
          const isOpen    = open.has(i);
          const bodyBorder = hexToRgba(branch.color, 0.25);

          return (
            <div key={i} className="dpm-branch" style={{ '--bc': branch.color } as React.CSSProperties}>
              <div
                className="dpm-bh"
                onClick={() => toggleBranch(i)}
                title={branch.desc}
              >
                <div className="dpm-dot" />
                <span className="dpm-bn">{branch.icon} {branch.name}</span>
                <span className="dpm-bcount">{countItems(branch)}</span>
                <span className={`dpm-arrow${isOpen ? ' open' : ''}`}>▶</span>
              </div>

              <div
                className="dpm-body"
                style={{
                  maxHeight:   isOpen ? '800px' : '0',
                  borderLeft:  `2px solid ${bodyBorder}`,
                }}
              >
                {branch.groups
                  ? branch.groups.map((g, gi) => (
                      <div key={gi}>
                        <div className="dpm-sg" style={{ color: branch.color }}>
                          ▸ {g.name}
                        </div>
                        <Products
                          items={g.items}
                          branchColor={branch.color}
                          textureOn={textureOn}
                          geoOn={geoOn}
                        />
                      </div>
                    ))
                  : branch.items && (
                      <Products
                        items={branch.items}
                        branchColor={branch.color}
                        textureOn={textureOn}
                        geoOn={geoOn}
                      />
                    )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legends */}
      {(textureOn || geoOn) && (
        <div className="dpm-legends">
          {textureOn && (
            <div className="dpm-legend-row">
              <span className="dpm-leg-label">TEXTURE →</span>
              {Object.entries(TEXTURES).map(([k, v]) => (
                <span key={k} className="dpm-leg-item">
                  <span className="dpm-leg-dot" style={{ background: v.color }} />
                  {v.label}
                </span>
              ))}
            </div>
          )}
          {geoOn && (
            <div className="dpm-legend-row">
              <span className="dpm-leg-label">ORIGIN →</span>
              {Object.entries(GEOS).map(([k, v]) => (
                <span key={k} className="dpm-leg-item">
                  <span className="dpm-leg-swatch" style={{ background: v.color }} />
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
