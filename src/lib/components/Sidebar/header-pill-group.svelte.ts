import { setContext, getContext } from 'svelte';

const CONTEXT_KEY = Symbol('header-pill-group');

export class HeaderPillGroup {
	maxRequiredWidth = $state(0);
	availableWidth = $state(0);
	shouldWrap = $derived(
		this.availableWidth > 0 &&
		this.maxRequiredWidth > 0 &&
		this.availableWidth < this.maxRequiredWidth
	);

	private widths = new Map<string, number>();

	register(id: string, el: HTMLElement) {
		const update = () => {
			const w = Math.ceil(el.getBoundingClientRect().width);
			if (w > 0) {
				this.widths.set(id, w);
				this.recalculate();
			}
		};

		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);

		return {
			destroy: () => {
				ro.disconnect();
				this.widths.delete(id);
				this.recalculate();
			}
		};
	}

	observeContainer(el: HTMLElement) {
		const update = () => {
			if (typeof window !== 'undefined') {
				const cs = window.getComputedStyle(el);
				const padLeft = parseFloat(cs.paddingLeft) || 0;
				const padRight = parseFloat(cs.paddingRight) || 0;
				this.availableWidth = Math.max(0, Math.floor(el.clientWidth - padLeft - padRight));
			} else {
				this.availableWidth = Math.floor(el.clientWidth);
			}
		};

		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);

		return {
			destroy: () => ro.disconnect()
		};
	}

	private recalculate() {
		let max = 0;
		for (const w of this.widths.values()) {
			if (w > max) max = w;
		}
		this.maxRequiredWidth = max;
	}
}

export function createHeaderPillGroup(): HeaderPillGroup {
	const group = new HeaderPillGroup();
	setContext(CONTEXT_KEY, group);
	return group;
}

export function useHeaderPillGroup(): HeaderPillGroup | undefined {
	return getContext<HeaderPillGroup | undefined>(CONTEXT_KEY);
}
