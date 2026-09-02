<script lang="ts">
	import { Pipette, Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { cn } from '$lib/utils';

	type PickerFormat = 'hex' | 'rgb' | 'hsl';
	type Rgb = { r: number; g: number; b: number };
	type Hsv = { h: number; s: number; v: number };

	let {
		value = $bindable('#7c3aed'),
		onChange,
		swatches = $bindable([
			'#000000',
			'#ffffff',
			'#6b7280',
			'#ef4444',
			'#f97316',
			'#eab308',
			'#22c55e',
			'#3b82f6',
			'#8b5cf6',
			'#ec4899'
		]),
		class: className
	}: {
		value?: string;
		onChange?: (value: string) => void;
		swatches?: string[];
		class?: string;
	} = $props();

	const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

	const round = (val: number, digits = 0) => {
		const factor = 10 ** digits;
		return Math.round(val * factor) / factor;
	};

	function parseHex(hex: string): { rgb: Rgb; a: number } | null {
		const raw = hex.trim().replace('#', '');

		if (!/^[0-9A-Fa-f]{3,4}$|^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{8}$/.test(raw)) {
			return null;
		}

		const normalized =
			raw.length <= 4
				? raw
						.split('')
						.map((char) => `${char}${char}`)
						.join('')
				: raw;

		const hasAlpha = normalized.length === 8;
		const r = Number.parseInt(normalized.slice(0, 2), 16);
		const g = Number.parseInt(normalized.slice(2, 4), 16);
		const b = Number.parseInt(normalized.slice(4, 6), 16);
		const a = hasAlpha ? Number.parseInt(normalized.slice(6, 8), 16) / 255 : 1;

		return { rgb: { r, g, b }, a };
	}

	function rgbToHex(rgb: Rgb, alpha = 1) {
		const base = [rgb.r, rgb.g, rgb.b]
			.map((val) => clamp(Math.round(val), 0, 255).toString(16).padStart(2, '0'))
			.join('');

		if (alpha >= 1) return `#${base}`;

		const a = clamp(Math.round(alpha * 255), 0, 255)
			.toString(16)
			.padStart(2, '0');

		return `#${base}${a}`;
	}

	function rgbToHsv({ r, g, b }: Rgb): Hsv {
		const rn = r / 255;
		const gn = g / 255;
		const bn = b / 255;
		const max = Math.max(rn, gn, bn);
		const min = Math.min(rn, gn, bn);
		const diff = max - min;

		let h = 0;
		if (diff !== 0) {
			if (max === rn) h = ((gn - bn) / diff) % 6;
			else if (max === gn) h = (bn - rn) / diff + 2;
			else h = (rn - gn) / diff + 4;
		}

		h = Math.round(h * 60);
		if (h < 0) h += 360;

		const s = max === 0 ? 0 : diff / max;
		const v = max;

		return { h, s: round(s * 100, 1), v: round(v * 100, 1) };
	}

	function hsvToRgb({ h, s, v }: Hsv): Rgb {
		const hue = ((h % 360) + 360) % 360;
		const sat = clamp(s, 0, 100) / 100;
		const val = clamp(v, 0, 100) / 100;

		const c = val * sat;
		const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
		const m = val - c;

		let r = 0;
		let g = 0;
		let b = 0;

		if (hue < 60) {
			r = c;
			g = x;
		} else if (hue < 120) {
			r = x;
			g = c;
		} else if (hue < 180) {
			g = c;
			b = x;
		} else if (hue < 240) {
			g = x;
			b = c;
		} else if (hue < 300) {
			r = x;
			b = c;
		} else {
			r = c;
			b = x;
		}

		return {
			r: Math.round((r + m) * 255),
			g: Math.round((g + m) * 255),
			b: Math.round((b + m) * 255)
		};
	}

	function rgbToHsl({ r, g, b }: Rgb) {
		const rn = r / 255;
		const gn = g / 255;
		const bn = b / 255;
		const max = Math.max(rn, gn, bn);
		const min = Math.min(rn, gn, bn);
		const l = (max + min) / 2;
		const d = max - min;

		let h = 0;
		let s = 0;

		if (d !== 0) {
			s = d / (1 - Math.abs(2 * l - 1));

			switch (max) {
				case rn:
					h = ((gn - bn) / d) % 6;
					break;
				case gn:
					h = (bn - rn) / d + 2;
					break;
				default:
					h = (rn - gn) / d + 4;
					break;
			}

			h *= 60;
			if (h < 0) h += 360;
		}

		return {
			h: Math.round(h),
			s: Math.round(s * 100),
			l: Math.round(l * 100)
		};
	}

	function hueToRgb(p: number, q: number, t: number) {
		let tt = t;
		if (tt < 0) tt += 1;
		if (tt > 1) tt -= 1;
		if (tt < 1 / 6) return p + (q - p) * 6 * tt;
		if (tt < 1 / 2) return q;
		if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
		return p;
	}

	function hslToRgb(h: number, s: number, l: number): Rgb {
		const hn = (((h % 360) + 360) % 360) / 360;
		const sn = clamp(s, 0, 100) / 100;
		const ln = clamp(l, 0, 100) / 100;

		if (sn === 0) {
			const val = Math.round(ln * 255);
			return { r: val, g: val, b: val };
		}

		const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
		const p = 2 * ln - q;

		return {
			r: Math.round(hueToRgb(p, q, hn + 1 / 3) * 255),
			g: Math.round(hueToRgb(p, q, hn) * 255),
			b: Math.round(hueToRgb(p, q, hn - 1 / 3) * 255)
		};
	}

	function toRgbaString(rgb: Rgb, alpha: number) {
		return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${round(alpha, 2)})`;
	}

	let initialParsed = parseHex(value || '#000000') ?? { rgb: { r: 0, g: 0, b: 0 }, a: 1 };
	let hsv = $state<Hsv>(rgbToHsv(initialParsed.rgb));
	let alpha = $state(initialParsed.a);
	let format = $state<PickerFormat>('hex');

	$effect(() => {
		const next = parseHex(value || '#000000');
		if (!next) return;
		hsv = rgbToHsv(next.rgb);
		alpha = next.a;
	});

	let rgb = $derived(hsvToRgb(hsv));
	let hsl = $derived(rgbToHsl(rgb));
	let hex = $derived(rgbToHex(rgb, alpha));

	function emit(nextHsv: Hsv, nextAlpha: number) {
		const nextRgb = hsvToRgb(nextHsv);
		const nextHex = rgbToHex(nextRgb, nextAlpha);
		value = nextHex;
		onChange?.(nextHex);
	}

	function updatePlane(clientX: number, clientY: number, el: HTMLElement) {
		const rect = el.getBoundingClientRect();
		const s = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
		const v = clamp(100 - ((clientY - rect.top) / rect.height) * 100, 0, 100);

		const next = { ...hsv, s: round(s, 1), v: round(v, 1) };
		hsv = next;
		emit(next, alpha);
	}

	function handlePlanePointerDown(event: PointerEvent) {
		const target = event.currentTarget as HTMLElement;
		target.setPointerCapture(event.pointerId);
		updatePlane(event.clientX, event.clientY, target);
	}

	function handlePlanePointerMove(event: PointerEvent) {
		if ((event.buttons & 1) !== 1) return;
		updatePlane(event.clientX, event.clientY, event.currentTarget as HTMLElement);
	}

	async function pickFromScreen() {
		if (typeof window === 'undefined' || !('EyeDropper' in window)) return;

		try {
			const EyeDropperClass = (
				window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }
			).EyeDropper;
			const eyeDropper = new EyeDropperClass();
			const result = await eyeDropper.open();
			const parsedColor = parseHex(result.sRGBHex);
			if (!parsedColor) return;

			const nextHsv = rgbToHsv(parsedColor.rgb);
			hsv = nextHsv;
			alpha = 1;
			emit(nextHsv, 1);
		} catch {
			// User cancelled eyedropper
		}
	}

	let textInputValue = $derived.by(() => {
		if (format === 'hex') return hex.toUpperCase();
		if (format === 'rgb') return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
		return `${hsl.h}, ${hsl.s}%, ${hsl.l}%`;
	});

	function handleTextInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const raw = input.value.trim();

		if (format === 'hex') {
			const parsedHex = parseHex(raw);
			if (!parsedHex) return;
			const next = rgbToHsv(parsedHex.rgb);
			hsv = next;
			alpha = parsedHex.a;
			emit(next, parsedHex.a);
			return;
		}

		if (format === 'rgb') {
			const parts = raw.split(',').map((part) => Number(part.trim()));
			if (parts.length !== 3 || parts.some((v) => Number.isNaN(v))) return;
			const nextRgb = {
				r: clamp(parts[0], 0, 255),
				g: clamp(parts[1], 0, 255),
				b: clamp(parts[2], 0, 255)
			};
			const next = rgbToHsv(nextRgb);
			hsv = next;
			emit(next, alpha);
			return;
		}

		const parts = raw
			.replaceAll('%', '')
			.split(',')
			.map((part) => Number(part.trim()));
		if (parts.length !== 3 || parts.some((v) => Number.isNaN(v))) return;

		const nextRgb = hslToRgb(parts[0], parts[1], parts[2]);
		const next = rgbToHsv(nextRgb);
		hsv = next;
		emit(next, alpha);
	}

	function addSwatch() {
		const currentHex = hex;
		const list = Array.isArray(swatches) ? swatches : [];
		if (list.includes(currentHex)) return;
		swatches = [...list, currentHex];
	}

	function removeSwatch(index: number) {
		const list = Array.isArray(swatches) ? swatches : [];
		swatches = list.filter((_, i) => i !== index);
	}
</script>

<div
	class={cn(
		'w-74 space-y-3.5 rounded-xl border border-border bg-card p-3.5 text-card-foreground shadow-lg',
		className
	)}
>
	<!-- 2D Color Plane -->
	<div class="relative h-48 w-full overflow-hidden rounded-lg border border-border/80 shadow-inner">
		<div class="absolute inset-0" style={`background-color: hsl(${hsv.h} 100% 50%);`}></div>
		<div class="absolute inset-0 bg-linear-to-r from-white to-transparent"></div>
		<div class="absolute inset-0 bg-linear-to-t from-black to-transparent"></div>

		<div
			class="absolute inset-0 cursor-crosshair touch-none"
			role="slider"
			tabindex="0"
			aria-label="Color saturation and value selection plane"
			aria-valuenow={hsv.s}
			onpointerdown={handlePlanePointerDown}
			onpointermove={handlePlanePointerMove}
		>
			<div
				class="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/20 transition-transform hover:scale-110"
				style={`left: ${hsv.s}%; top: ${100 - hsv.v}%; background-color: ${toRgbaString(rgb, alpha)};`}
			></div>
		</div>
	</div>

	<!-- Hue & Alpha Sliders -->
	<div class="space-y-2.5">
		<!-- Hue Slider -->
		<div class="relative h-3.5 overflow-hidden rounded-full border border-border/60">
			<input
				type="range"
				min={0}
				max={360}
				value={hsv.h}
				oninput={(e) => {
					const h = Number(e.currentTarget.value);
					const next = { ...hsv, h };
					hsv = next;
					emit(next, alpha);
				}}
				class="color-slider absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none rounded-full p-0"
				style="background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);"
			/>
		</div>

		<!-- Alpha Slider -->
		<div
			class="checkerboard-bg relative h-3.5 overflow-hidden rounded-full border border-border/60"
		>
			<input
				type="range"
				min={0}
				max={100}
				value={Math.round(alpha * 100)}
				oninput={(e) => {
					const nextAlpha = Number(e.currentTarget.value) / 100;
					alpha = nextAlpha;
					emit(hsv, nextAlpha);
				}}
				class="color-slider absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none rounded-full p-0"
				style={`background: linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1));`}
			/>
		</div>
	</div>

	<!-- Format Controls & Eyedropper -->
	<div class="grid grid-cols-[auto_1fr_auto] items-center gap-2">
		<Button
			type="button"
			variant="outline"
			size="icon-sm"
			onclick={pickFromScreen}
			disabled={typeof window === 'undefined' || !('EyeDropper' in window)}
			title="Eyedropper"
			class="h-8 w-8"
		>
			<Pipette class="h-3.5 w-3.5" />
		</Button>

		<Input
			value={textInputValue}
			onchange={handleTextInputChange}
			class="h-8 font-mono text-xs tracking-wider uppercase"
		/>

		<Select
			type="single"
			value={format}
			onValueChange={(val) => {
				if (val) format = val as PickerFormat;
			}}
		>
			<SelectTrigger class="h-8 w-18 text-xs font-medium">
				{format.toUpperCase()}
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="hex">Hex</SelectItem>
				<SelectItem value="rgb">RGB</SelectItem>
				<SelectItem value="hsl">HSL</SelectItem>
			</SelectContent>
		</Select>
	</div>

	<!-- Swatches -->
	<div class="flex flex-wrap items-center gap-1.5 pt-0.5">
		{#each swatches ?? [] as swatch, index (index)}
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				class="checkerboard-bg relative overflow-hidden cursor-pointer p-0"
				onclick={() => {
					const parsedSwatch = parseHex(swatch);
					if (!parsedSwatch) return;
					const next = rgbToHsv(parsedSwatch.rgb);
					hsv = next;
					alpha = parsedSwatch.a;
					emit(next, parsedSwatch.a);
				}}
				oncontextmenu={(e) => {
					e.preventDefault();
					removeSwatch(index);
				}}
				title={`Select ${swatch} (Right-click to remove)`}
				aria-label={`Select ${swatch}`}
			>
				<span
					class="absolute inset-0"
					style={`background-color: ${swatch};`}
				></span>
			</Button>
		{/each}

		<Button
			type="button"
			variant="outline"
			size="icon-xs"
			onclick={addSwatch}
			title="Save current color to swatches"
			class="h-6 w-6 rounded-md"
		>
			<Plus class="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
		</Button>
	</div>
</div>

<style>
	.checkerboard-bg {
		background-image: repeating-conic-gradient(var(--border) 0 25%, transparent 0 50%);
		background-size: 8px 8px;
	}

	.color-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 9999px;
		border: 2px solid #ffffff;
		background: var(--foreground);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
		cursor: pointer;
		transition: transform 0.15s ease;
	}
	.color-slider::-webkit-slider-thumb:hover {
		transform: scale(1.15);
	}
	.color-slider::-webkit-slider-runnable-track {
		height: 100%;
		border-radius: 9999px;
	}
	.color-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 9999px;
		border: 2px solid #ffffff;
		background: var(--foreground);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
		cursor: pointer;
		transition: transform 0.15s ease;
	}
	.color-slider::-moz-range-thumb:hover {
		transform: scale(1.15);
	}
	.color-slider::-moz-range-track {
		height: 100%;
		border-radius: 9999px;
	}
</style>
