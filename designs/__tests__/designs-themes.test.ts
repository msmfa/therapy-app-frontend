import { darkTheme, lightTheme } from '../designs-themes';
import {
    ACCENT_SURFACE,
    BRAND_ORANGE,
    CALENDAR_MONTH_COLORS,
    PALETTE,
    SURFACE_BLUE,
    TEXT_COLORS,
} from '../designs-colors';
import { APP_GRADIENT } from '../designs-gradients';

/**
 * A component that reads `theme.x.y` in one theme has to find the same kind of
 * value there in the other, or a screen renders correctly in light and blows
 * up (or paints undefined) in dark. Types catch a missing key; this catches a
 * key whose value changes kind, such as a gradient in one theme and a string
 * in the other.
 */
type Shape = Record<string, unknown>;

function describeShape(value: unknown, path: string, out: Map<string, string>): void {
    if (value === null) {
        // An optional gradient: present in one theme, absent in the other.
        // Matches any kind on the other side, checked below.
        out.set(path, 'optional');
        return;
    }
    if (Array.isArray(value)) {
        out.set(path, 'array');
        return;
    }
    if (typeof value === 'object') {
        for (const [key, child] of Object.entries(value as Shape)) {
            describeShape(child, path ? `${path}.${key}` : key, out);
        }
        return;
    }
    out.set(path, typeof value);
}

describe('designs-themes', () => {
    it('gives both themes exactly the same shape', () => {
        const light = new Map<string, string>();
        const dark = new Map<string, string>();
        describeShape(lightTheme, '', light);
        describeShape(darkTheme, '', dark);

        expect([...dark.keys()].sort()).toEqual([...light.keys()].sort());
        for (const [path, kind] of light) {
            const darkKind = dark.get(path);
            if (kind === 'optional' || darkKind === 'optional') continue;
            expect({ path, kind: darkKind }).toEqual({ path, kind });
        }
        // The optional gradients are null where a theme draws none.
        expect(lightTheme.emphasis.rule).toBeNull();
        expect(darkTheme.emphasis.rule).toBeNull();
        expect(lightTheme.accentScreen.glow).toBeNull();
        expect(darkTheme.accentScreen.glow).not.toBeNull();
    });

    it('keeps the light theme on the primitives the app already paints with', () => {
        // Adopting the theme must not move a single light pixel. Spot-check the
        // values most of the app is built on.
        expect(lightTheme.ink).toEqual(TEXT_COLORS);
        expect(lightTheme.ground.gradient).toBe(APP_GRADIENT);
        expect(lightTheme.ground.base).toBe(SURFACE_BLUE);
        expect(lightTheme.surface.card).toBe(PALETTE.overlay.whiteSurfaceTransparent);
        expect(lightTheme.surface.cardShadow).toBe(PALETTE.overlay.blueGlowTransparent);
        expect(lightTheme.chosen.fill).toBe(BRAND_ORANGE);
        expect(lightTheme.accentScreen.textPrimary).toBe(ACCENT_SURFACE.textPrimary);
        expect(lightTheme.calendar.month).toBe(CALENDAR_MONTH_COLORS);
        expect(lightTheme.statusBar).toBe('dark-content');
    });

    it('flips the things the OS reads', () => {
        expect(darkTheme.scheme).toBe('dark');
        expect(darkTheme.statusBar).toBe('light-content');
        expect(darkTheme.glass.tint).toBe('dark');
        expect(darkTheme.calendar.backdrop.blurTint).toBe('dark');
    });

    it('keeps the tinted-surface helpers clamped to the hue wheel', () => {
        for (const theme of [lightTheme, darkTheme]) {
            expect(theme.surface.tinted(20)).toContain('(20,');
            expect(theme.surface.tintedBorder(20)).toContain('(20,');
        }
    });
});
