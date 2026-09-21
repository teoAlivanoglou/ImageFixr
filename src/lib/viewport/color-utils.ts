/**
 * Color parsing and conversion utilities for Viewport rendering and UI controls.
 */

/**
 * Parses a color string (HEX #RGB, #RGBA, #RRGGBB, #RRGGBBAA, or rgb()/rgba())
 * into normalized RGBA floats [0..1].
 */
export function parseRgbaColor(colorStr: string): [number, number, number, number] {
	if (!colorStr) return [0, 0, 0, 1];
	const raw = colorStr.trim();

	let r = 0;
	let g = 0;
	let b = 0;
	let a = 1;

	if (raw.startsWith('#')) {
		const hex = raw.slice(1);
		const normalized =
			hex.length <= 4
				? hex
						.split('')
						.map((char) => `${char}${char}`)
						.join('')
				: hex;

		r = (parseInt(normalized.slice(0, 2), 16) || 0) / 255;
		g = (parseInt(normalized.slice(2, 4), 16) || 0) / 255;
		b = (parseInt(normalized.slice(4, 6), 16) || 0) / 255;
		if (normalized.length === 8) {
			a = (parseInt(normalized.slice(6, 8), 16) || 0) / 255;
		}
	} else {
		const rgbaMatch = raw.match(
			/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
		);
		if (rgbaMatch) {
			r = (parseFloat(rgbaMatch[1]) || 0) / 255;
			g = (parseFloat(rgbaMatch[2]) || 0) / 255;
			b = (parseFloat(rgbaMatch[3]) || 0) / 255;
			a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
		}
	}
	return [r, g, b, a];
}

/**
 * Parses a color string into RGB integers [0..255].
 */
export function parseColorRgb(colorStr: string): { r: number; g: number; b: number } {
	const [r, g, b] = parseRgbaColor(colorStr);
	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
}

/**
 * Parses a color string into a hex color string ('#rrggbb') and alpha float [0..1].
 */
export function parseColorString(colorStr: string): { color: string; alpha: number } {
	if (!colorStr) return { color: '#000000', alpha: 1 };
	const [r, g, b, a] = parseRgbaColor(colorStr);
	const hexR = Math.round(r * 255)
		.toString(16)
		.padStart(2, '0');
	const hexG = Math.round(g * 255)
		.toString(16)
		.padStart(2, '0');
	const hexB = Math.round(b * 255)
		.toString(16)
		.padStart(2, '0');
	return { color: `#${hexR}${hexG}${hexB}`, alpha: a };
}

/**
 * Converts normalized RGB floats [0..1] to a 24-bit numeric hex color (0xRRGGBB).
 */
export function rgbToHexNumber(r: number, g: number, b: number): number {
	return (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255);
}
