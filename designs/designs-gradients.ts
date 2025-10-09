import { COLOR_VARIANTS } from './designs-colors';
import { GradientColors } from 'src/utils/types';

export const APP_GRADIENT = [
  'hsla(357, 100%, 93%, 1.00)',
  'hsla(357, 60%, 88%, 1.00)',
  'hsla(354, 54%, 89%, 1.00)',
  'hsl(206.67, 17.65%, 90.00%)',
  'hsl(206.67, 17.65%, 90.00%)',
  'hsl(206.67, 17.65%, 90.00%)',
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
  tintedBackground: (hueValue: number) => `hsla(${clampHue(hueValue)}, 70%, 90%, 0.35)`,
  tintedBorder: (hueValue: number) => `hsla(${clampHue(hueValue)}, 70%, 80%, 0.30)`,
};

export const CARD_GRADIENTS: GradientColors[] = [
  [COLOR_VARIANTS.red.mid, COLOR_VARIANTS.red.dark],
  [COLOR_VARIANTS.blue.mid, COLOR_VARIANTS.blue.dark],
  ['#8FFFD4', '#5FFFB0'],
  ['#FFE67C', '#FFDB5C'],
];
