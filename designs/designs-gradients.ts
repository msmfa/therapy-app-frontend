import { COLOR_VARIANTS, SURFACE_BLUE } from './designs-colors';
import { GradientColors } from 'src/utils/types';

export const APP_GRADIENT = [
  'hsla(357, 100%, 93%, 1.00)',
  'hsla(357, 60%, 88%, 1.00)',
  'hsla(354, 54%, 89%, 1.00)',
  SURFACE_BLUE,
  SURFACE_BLUE,
  SURFACE_BLUE,
] as const;

export const GRADIENT_STOPS = {
  top: APP_GRADIENT[0],
  mid: APP_GRADIENT[1],
  soft: APP_GRADIENT[2],
  bottom: APP_GRADIENT[APP_GRADIENT.length - 1],
} as const;

export const GRADIENTS = {
  appBackground: APP_GRADIENT,
  background: GRADIENT_STOPS,
} as const;

const clampHue = (value: number) => Math.max(0, Math.min(360, value));

export const SURFACE_TINTS = {
  defaultBackground: 'hsla(0, 0%, 100%, 0.29)',
  defaultBorder: 'hsla(0, 0%, 100%, 0.21)',
  // Cards sitting on the pale blue sheet, which is too light for the
  // translucent-white surfaces used over the app's colour.
  sheetCardBackground: 'hsla(0, 0%, 100%, 0.72)',
  sheetCardBorder: 'hsla(206, 18%, 62%, 0.30)',
  tintedBackground: (hueValue: number) => `hsla(${clampHue(hueValue)}, 78%, 82%, 0.58)`,
  tintedBorder: (hueValue: number) => `hsla(${clampHue(hueValue)}, 74%, 72%, 0.50)`,
};

export const CARD_GRADIENTS: GradientColors[] = [
  [COLOR_VARIANTS.red.mid, COLOR_VARIANTS.red.dark],
  [COLOR_VARIANTS.blue.mid, COLOR_VARIANTS.blue.dark],
  ['#8FFFD4', '#5FFFB0'],
  ['#FFE67C', '#FFDB5C'],
];

// The backdrop the calendar month sits on. Measured off the design: a pale
// near-neutral grey, with a blue glow hanging off the top edge that runs out
// before the last week of the month so the grid ends on flat light grey.
// Semi-opaque, so the app's own pale blue shows through and the whole backdrop
// reads as a sheet of glass rather than a painted panel.
export const DARK_BACKDROP_BASE = [
  'hsla(240, 5%, 96%, 0.62)',
  'hsla(240, 5%, 94%, 0.55)',
  'hsla(240, 4%, 92%, 0.46)',
  'hsla(240, 4%, 91%, 0.38)',
] as const;

export const DARK_BACKDROP_BASE_LOCATIONS = [0, 0.4, 0.72, 1] as const;

export const DARK_BACKDROP_GLOW = [
  'hsla(220, 60%, 50%, 0.22)',
  'hsla(220, 55%, 48%, 0.08)',
  'hsla(220, 50%, 45%, 0)',
] as const;

export const DARK_BACKDROP_GLOW_LOCATIONS = [0, 0.38, 1] as const;
