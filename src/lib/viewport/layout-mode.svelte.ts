import { computeLayoutMode, type LayoutMode } from './layout-mode';

class LayoutModeState {
	current = $state<LayoutMode>(
		typeof window !== 'undefined'
			? computeLayoutMode(
					window.innerWidth,
					window.innerHeight,
					window.screen?.width,
					window.screen?.height
				)
			: 'desktop'
	);

	constructor() {
		if (typeof window !== 'undefined') {
			const update = () => {
				this.current = computeLayoutMode(
					window.innerWidth,
					window.innerHeight,
					window.screen?.width,
					window.screen?.height
				);
			};
			window.addEventListener('resize', update, { passive: true });
			window.addEventListener('orientationchange', update, { passive: true });
		}
	}
}

export const layoutMode = new LayoutModeState();
