export type LayoutMode = 'desktop' | 'desktop-portrait' | 'mobile';

export function computeLayoutMode(width: number, height: number): LayoutMode {
	if (height < 600) {
		return 'mobile';
	}
	const isPortrait = height > width;
	if (width >= 1024) {
		return isPortrait ? 'desktop-portrait' : 'desktop';
	}
	if (width >= 768 && !isPortrait) {
		return 'desktop';
	}
	return 'mobile';
}
