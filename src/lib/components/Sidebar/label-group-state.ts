export class LabelGroupState {
	private widths = new Map<string, number>();
	maxWidth = 0;

	setWidth(id: string, width: number) {
		this.widths.set(id, width);
		this.recalculate();
	}

	remove(id: string) {
		this.widths.delete(id);
		this.recalculate();
	}

	private recalculate() {
		let max = 0;
		for (const w of this.widths.values()) {
			if (w > max) max = w;
		}
		this.maxWidth = max;
	}
}
