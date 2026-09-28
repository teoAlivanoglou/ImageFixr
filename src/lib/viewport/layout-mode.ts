export type LayoutMode = 'desktop' | 'desktop-portrait' | 'mobile-portrait' | 'mobile-landscape';

export function computeLayoutMode(
	width: number,
	height: number,
	screenWidth?: number,
	screenHeight?: number
): LayoutMode {
	const isPortrait = height > width;

	// If physical screen dimensions are known and indicate a phone (narrow dimension < 600px),
	// prevent device-zoom / viewport-scale from ever misidentifying a phone as a desktop or iPad.
	if (screenWidth !== undefined && screenHeight !== undefined) {
		const minScreenDim = Math.min(screenWidth, screenHeight);
		if (minScreenDim > 0 && minScreenDim < 600) {
			return isPortrait ? 'mobile-portrait' : 'mobile-landscape';
		}
	}

	if (isPortrait) {
		// Portrait screens:
		// >= 768px width & >= 600px height -> vertically mounted monitors & portrait tablets (iPad)
		if (width >= 768 && height >= 600) {
			return 'desktop-portrait';
		}
		// Otherwise phone portrait
		return 'mobile-portrait';
	} else {
		// Landscape screens:
		// If height < 600px or width < 768px -> mobile phone in landscape
		if (height < 600 || width < 768) {
			return 'mobile-landscape';
		}
		// Otherwise desktop landscape & large landscape tablets
		return 'desktop';
	}
}
