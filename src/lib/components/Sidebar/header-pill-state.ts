export class HeaderPillState {
	private widths = new Map<string, number>();
	maxRequiredWidth = 0;
	availableWidth = 0;

	get shouldWrap(): boolean {
		return (
			this.availableWidth > 0 &&
			this.maxRequiredWidth > 0 &&
			this.availableWidth < this.maxRequiredWidth
		);
	}

	setWidth(id: string, width: number) {
		this.widths.set(id, width);
		this.recalculate();
	}

	remove(id: string) {
		this.widths.delete(id);
		this.recalculate();
	}

	setAvailableWidth(width: number) {
		this.availableWidth = width;
	}

	private recalculate() {
		let max = 0;
		for (const w of this.widths.values()) {
			if (w > max) max = w;
		}
		this.maxRequiredWidth = max;
	}
}
