/**
 * WCAG contrast for the colour strings the design tokens are written in.
 *
 * Parses `hsl()`, `hsla()`, `rgb()`, `rgba()` and six-digit hex, composites a
 * translucent colour over the layers under it, and reports the ratio the way
 * a contrast checker would. Used by the accessibility tests to hold every
 * text-on-ground pair in the dark theme at 4.5:1 or better.
 */

export type Rgba = { r: number; g: number; b: number; a: number };

const HSL = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i;
const RGB = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;
const HEX = /^#([0-9a-f]{6})$/i;

const hslChannel = (hue: number, saturation: number, lightness: number, n: number): number => {
    const k = (n + hue / 30) % 12;
    const chroma = saturation * Math.min(lightness, 1 - lightness);
    return lightness - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1));
};

/** Throws on anything it cannot read, so a typo in a token fails the test that uses it. */
export function parseColor(input: string): Rgba {
    const value = input.trim();
    const hsl = value.match(HSL);
    if (hsl) {
        const hue = Number(hsl[1]);
        const saturation = Number(hsl[2]) / 100;
        const lightness = Number(hsl[3]) / 100;
        return {
            r: hslChannel(hue, saturation, lightness, 0),
            g: hslChannel(hue, saturation, lightness, 8),
            b: hslChannel(hue, saturation, lightness, 4),
            a: hsl[4] === undefined ? 1 : Number(hsl[4]),
        };
    }
    const rgb = value.match(RGB);
    if (rgb) {
        return {
            r: Number(rgb[1]) / 255,
            g: Number(rgb[2]) / 255,
            b: Number(rgb[3]) / 255,
            a: rgb[4] === undefined ? 1 : Number(rgb[4]),
        };
    }
    const hex = value.match(HEX);
    if (hex) {
        const packed = parseInt(hex[1], 16);
        return { r: (packed >> 16) / 255, g: ((packed >> 8) & 255) / 255, b: (packed & 255) / 255, a: 1 };
    }
    throw new Error(`Unreadable colour: ${input}`);
}

/** `top` composited over an opaque `bottom`. */
export const over = (top: Rgba, bottom: Rgba): Rgba => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
});

const linear = (channel: number): number =>
    channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

export const relativeLuminance = ({ r, g, b }: Rgba): number =>
    0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

/**
 * The contrast of `text` read on a stack of `layers`, given bottom-most last.
 * Every layer may be translucent; the last must be opaque enough to stand
 * for the screen.
 */
export function contrastRatio(text: string, ...layers: string[]): number {
    if (layers.length === 0) throw new Error('contrastRatio needs at least one ground layer');
    let ground = parseColor(layers[layers.length - 1]);
    for (let index = layers.length - 2; index >= 0; index -= 1) {
        ground = over(parseColor(layers[index]), ground);
    }
    const ink = over(parseColor(text), ground);
    const lighter = Math.max(relativeLuminance(ink), relativeLuminance(ground));
    const darker = Math.min(relativeLuminance(ink), relativeLuminance(ground));
    return (lighter + 0.05) / (darker + 0.05);
}
