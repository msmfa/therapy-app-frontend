/**
 * The two themes, one shape. Components import from here and never from a
 * primitive layer (designs-colors, designs-gradients, designs-night) directly.
 */

import type { Theme } from './designs-theme-shape';
import { darkTheme } from './designs-theme-dark';
import { lightTheme } from './designs-theme-light';

export { darkTheme, lightTheme };
export type { ColorScheme, GradientLocations, GradientStops, Theme } from './designs-theme-shape';

export const themeFor = (scheme: 'light' | 'dark'): Theme => (scheme === 'dark' ? darkTheme : lightTheme);
