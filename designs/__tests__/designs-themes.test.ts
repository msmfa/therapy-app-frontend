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

/**
 * An optional value may be a whole object on the other side, such as a card
 * light with a face and a rim. Its leaves fold back into the one path so the
 * two maps line up, and the kind check below skips it as optional.
 */
function collapseOptional(optional: Map<string, string>, other: Map<string, string>): void {
    for (const [path, kind] of optional) {
        if (kind !== 'optional') continue;
        const prefix = `${path}.`;
        const nested = [...other.keys()].filter((key) => key.startsWith(prefix));
        if (nested.length === 0) continue;
        for (const key of nested) other.delete(key);
        other.set(path, 'object');
    }
}

describe('designs-themes', () => {
    it('gives both themes exactly the same shape', () => {
        const light = new Map<string, string>();
        const dark = new Map<string, string>();
        describeShape(lightTheme, '', light);
        describeShape(darkTheme, '', dark);
        collapseOptional(light, dark);
        collapseOptional(dark, light);

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
        // The corner light on the night's cards, none on the day's flat ones.
        expect(lightTheme.surface.cardLight).toBeNull();
        expect(lightTheme.chosen.light).toBeNull();
        expect(darkTheme.surface.cardLight).not.toBeNull();
        expect(darkTheme.chosen.light).not.toBeNull();
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

/**
 * The session day's numeral sits on a solid orange disc, and orange is easy
 * to nudge below legibility. The ratio is held here rather than in a comment:
 * the 4.5:1 body-text minimum, since the numeral is 17px.
 */
describe('session day contrast', () => {
    const channel = (value: number) => {
        const v = value / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    const contrast = (a: number[], b: number[]) => {
        const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (hi + 0.05) / (lo + 0.05);
    };
    // Hex (#rrggbb) or hsl(h, s%, l%), the two forms the month's colours use.
    const rgb = (color: string): number[] => {
        if (color.startsWith('#')) return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
        const [h, s, l] = (color.match(/[\d.]+/g) ?? []).map(Number);
        const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            return 255 * (l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
        };
        return [f(0), f(8), f(4)];
    };

    it.each([
        ['light', lightTheme],
        ['dark', darkTheme],
    ] as const)('%s: the numeral reads on the disc', (_name, theme) => {
        const month = theme.calendar.month;
        expect(contrast(rgb(month.sessionFillText), rgb(month.sessionFill))).toBeGreaterThanOrEqual(4.5);
    });
});
