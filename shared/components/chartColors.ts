/**
 * chartColors — SINGLE SOURCE OF TRUTH for chart series colours.
 *
 * After the brand-colour unification (everything → navy #002868), monochrome
 * "navy ramp" palettes left adjacent pie/bar series almost indistinguishable.
 * This is a curated CATEGORICAL palette: brand-led, high-contrast, and solid
 * (no gradients) so it matches the flat house style.
 *
 * Usage:
 *   import { CHART_COLORS, chartColor, CHART_SEMANTIC } from '@shared/components/chartColors';
 *   fill={chartColor(i)}                       // categorical series by index
 *   stroke={CHART_SEMANTIC.primary}            // single-series brand line/bar
 *   color={value >= 0 ? CHART_SEMANTIC.positive : CHART_SEMANTIC.negative}
 */

// Distinct, on-brand categorical hues. Order starts with the brand pair.
export const CHART_COLORS = [
  '#002868', // navy   — brand primary
  '#01411C', // green  — brand secondary
  '#b22234', // red
  '#c77800', // amber
  '#2c7fb8', // sky blue
  '#6b3fa0', // violet
  '#0f9b8e', // teal
  '#8a8d98', // slate
];

// Semantic series colours (P&L up/down, status, single-series brand).
export const CHART_SEMANTIC = {
  primary:  '#002868',
  positive: '#01411C',
  negative: '#b22234',
  warning:  '#c77800',
  neutral:  '#5b6472',
};

/** Categorical colour for series index `i` (wraps around the palette). */
export const chartColor = (i: number): string =>
  CHART_COLORS[((i % CHART_COLORS.length) + CHART_COLORS.length) % CHART_COLORS.length];
