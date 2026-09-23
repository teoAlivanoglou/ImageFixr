import { setContext, getContext } from 'svelte';

const CONTEXT_KEY = Symbol('label-group');

export class LabelGroup {
	maxWidth = $state(0);
	private widths = new Map<string, number>();

	register(id: string, el: HTMLElement) {
		const update = () => {
			const w = el.getBoundingClientRect().width;
			this.widths.set(id, w);
			let max = 0;
			for (const val of this.widths.values()) {
				if (val > max) max = val;
			}
			this.maxWidth = max;
		};

		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);

		return {
			destroy: () => {
				ro.disconnect();
				this.widths.delete(id);
				let max = 0;
				for (const val of this.widths.values()) {
					if (val > max) max = val;
				}
				this.maxWidth = max;
			}
		};
	}
}

export function createLabelGroup() {
	const group = new LabelGroup();
	setContext(CONTEXT_KEY, group);
	return group;
}

export function useLabelGroup() {
	return getContext<LabelGroup | undefined>(CONTEXT_KEY);
}
