<script lang="ts">
	import { Pipette, Plus } from '@lucide/svelte';
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { cn } from '$lib/utils';

	type PickerFormat = 'hex' | 'rgb' | 'hsb';
	type Rgb = { r: number; g: number; b: number };
	type Hsv = { h: number; s: number; v: number };

	let {
		value = $bindable('#007595'),
		onChange,
		onValueCommit,
		onResetSwatches,
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
			'#ec4899',
			'#007595'
		]),
		class: className
	}: {
		value?: string;
		onChange?: (value: string) => void;
		onValueCommit?: (value: string) => void;
		onResetSwatches?: () => void;
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

	function rgbToHsv({ r, g, b }: Rgb, fallbackHue = 0, fallbackSat = 0): Hsv {
		const rn = r / 255;
		const gn = g / 255;
		const bn = b / 255;
		const max = Math.max(rn, gn, bn);
		const min = Math.min(rn, gn, bn);
		const diff = max - min;

		let h = fallbackHue;
		if (diff > 0.0001) {
			if (max === rn) h = ((gn - bn) / diff) % 6;
			else if (max === gn) h = (bn - rn) / diff + 2;
			else h = (rn - gn) / diff + 4;

			h = Math.round(h * 60);
			if (h < 0) h += 360;
		}

		const s = max === 0 ? fallbackSat : (diff / max) * 100;
		const v = max * 100;

		return { h, s: round(s, 1), v: round(v, 1) };
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

	function toRgbaString(rgb: Rgb, alpha: number) {
		return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${round(alpha, 2)})`;
	}

	let initialParsed = parseHex(value || '#000000') ?? { rgb: { r: 0, g: 0, b: 0 }, a: 1 };
	let hsv = $state<Hsv>(rgbToHsv(initialParsed.rgb));
	let alpha = $state(initialParsed.a);
	let format = $state<PickerFormat>('hex');
	let lastEmittedHex = (value || '').trim().toLowerCase();

	$effect(() => {
		const currentVal = (value || '#000000').trim().toLowerCase();
		if (currentVal === lastEmittedHex) return;
		const next = parseHex(value || '#000000');
		if (!next) return;
		hsv = rgbToHsv(next.rgb, hsv.h, hsv.s);
		alpha = next.a;
		lastEmittedHex = currentVal;
	});

	let rgb = $derived(hsvToRgb(hsv));
	let hex = $derived(rgbToHex(rgb, alpha));
	let alphaPercent = $derived(Math.round(alpha * 100));

	function emit(nextHsv: Hsv, nextAlpha: number, isCommit = false) {
		const nextRgb = hsvToRgb(nextHsv);
		const nextHex = rgbToHex(nextRgb, nextAlpha);
		lastEmittedHex = nextHex.toLowerCase();
		value = nextHex;
		onChange?.(nextHex);
		if (isCommit) {
			onValueCommit?.(nextHex);
		}
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

	function handlePlanePointerUp(event: PointerEvent) {
		const target = event.currentTarget as HTMLElement;
		if (target.hasPointerCapture(event.pointerId)) {
			target.releasePointerCapture(event.pointerId);
		}
		emit(hsv, alpha, true);
	}

	let hasEyeDropper = $state(false);

	$effect(() => {
		hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
	});

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

			const nextHsv = rgbToHsv(parsedColor.rgb, hsv.h, hsv.s);
			hsv = nextHsv;
			alpha = 1;
			emit(nextHsv, 1, true);
		} catch {
			// User cancelled eyedropper
		}
	}

	let textInputValue = $derived.by(() => {
		if (format === 'hex') return hex.toUpperCase();
		if (format === 'rgb') return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
		return `${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%`;
	});

	function handleTextInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const raw = input.value.trim();

		if (format === 'hex') {
			const parsedHex = parseHex(raw);
			if (!parsedHex) return;
			const next = rgbToHsv(parsedHex.rgb, hsv.h, hsv.s);
			hsv = next;
			alpha = parsedHex.a;
			emit(next, parsedHex.a, true);
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
			const next = rgbToHsv(nextRgb, hsv.h, hsv.s);
			hsv = next;
			emit(next, alpha, true);
			return;
		}

		const parts = raw
			.replaceAll('%', '')
			.split(',')
			.map((part) => Number(part.trim()));
		if (parts.length !== 3 || parts.some((v) => Number.isNaN(v))) return;

		const next = {
			h: clamp(Math.round(parts[0]), 0, 360),
			s: clamp(round(parts[1], 1), 0, 100),
			v: clamp(round(parts[2], 1), 0, 100)
		};
		hsv = next;
		emit(next, alpha, true);
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
		'w-74 max-w-[calc(100vw-2rem)] space-y-3.5 rounded-xl border border-border bg-card p-3.5 text-card-foreground shadow-lg',
		className
	)}
>
	<!-- 2D Color Plane -->
	<div
		class="relative h-[clamp(80px,calc(100dvh-220px),192px)] w-full shrink overflow-hidden rounded-lg border border-border/80 shadow-inner"
	>
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
			onpointerup={handlePlanePointerUp}
			onpointercancel={handlePlanePointerUp}
		>
			<div
				class="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md ring-1 ring-black/20 transition-transform hover:scale-110"
				style={`left: ${hsv.s}%; top: ${100 - hsv.v}%; background-color: ${toRgbaString(rgb, alpha)};`}
			></div>
		</div>
	</div>

	<!-- Hue & Alpha Sliders -->
	<div class="space-y-1.5">
		<!-- Hue Slider -->
		<SliderPrimitive.Root
			type="single"
			bind:value={hsv.h}
			min={0}
			max={360}
			step={1}
			onValueChange={(val) => {
				const next = { ...hsv, h: val };
				hsv = next;
				emit(next, alpha);
			}}
			onValueCommit={() => {
				emit(hsv, alpha, true);
			}}
			class="relative flex h-5 w-full cursor-pointer touch-none items-center select-none"
			aria-label="Color hue slider"
		>
			{#snippet children({ thumbItems })}
				<span
					data-slot="slider-track"
					class="relative h-3 w-full overflow-hidden rounded-full border border-border/60 bg-card"
				>
					<span
						class="absolute inset-0"
						style="background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);"
					></span>
				</span>
				{#each thumbItems as thumb (thumb.index)}
					<SliderPrimitive.Thumb
						data-slot="slider-thumb"
						index={thumb.index}
						class="relative block size-3.5 shrink-0 cursor-pointer rounded-full border-2 border-white bg-foreground shadow-md ring-1 ring-black/25 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden active:scale-95"
					/>
				{/each}
			{/snippet}
		</SliderPrimitive.Root>

		<!-- Alpha Slider -->
		<SliderPrimitive.Root
			type="single"
			value={alphaPercent}
			min={0}
			max={100}
			step={1}
			onValueChange={(val) => {
				const nextAlpha = val / 100;
				alpha = nextAlpha;
				emit(hsv, nextAlpha);
			}}
			onValueCommit={() => {
				emit(hsv, alpha, true);
			}}
			class="relative flex h-5 w-full cursor-pointer touch-none items-center select-none"
			aria-label="Color opacity slider"
		>
			{#snippet children({ thumbItems })}
				<span
					data-slot="slider-track"
					class="relative h-3 w-full overflow-hidden rounded-full border border-border/60 bg-card"
				>
					<span class="checkerboard-bg absolute inset-0"></span>
					<span
						class="absolute inset-0"
						style={`background: linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1));`}
					></span>
				</span>
				{#each thumbItems as thumb (thumb.index)}
					<SliderPrimitive.Thumb
						data-slot="slider-thumb"
						index={thumb.index}
						class="relative block size-3.5 shrink-0 cursor-pointer rounded-full border-2 border-white bg-foreground shadow-md ring-1 ring-black/25 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden active:scale-95"
					/>
				{/each}
			{/snippet}
		</SliderPrimitive.Root>
	</div>

	<!-- Format Controls & Eyedropper -->
	<div
		class={cn(
			'grid items-center gap-2',
			hasEyeDropper ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto]'
		)}
	>
		{#if hasEyeDropper}
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				onclick={pickFromScreen}
				title="Eyedropper"
				class="h-8 w-8"
			>
				<Pipette class="h-3.5 w-3.5" />
			</Button>
		{/if}

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
				<SelectItem value="hsb">HSB</SelectItem>
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
				class="relative h-6 w-6 cursor-pointer overflow-hidden rounded-md border-border bg-card p-0"
				onclick={() => {
					const parsedSwatch = parseHex(swatch);
					if (!parsedSwatch) return;
					const next = rgbToHsv(parsedSwatch.rgb, hsv.h, hsv.s);
					hsv = next;
					alpha = parsedSwatch.a;
					emit(next, parsedSwatch.a, true);
				}}
				oncontextmenu={(e) => {
					e.preventDefault();
					removeSwatch(index);
				}}
				title={`Select ${swatch} (Right-click to remove)`}
				aria-label={`Select ${swatch}`}
			>
				<span class="checkerboard-bg absolute inset-0"></span>
				<span class="absolute inset-0" style={`background-color: ${swatch};`}></span>
			</Button>
		{/each}

		<Button
			type="button"
			variant="outline"
			size="icon-xs"
			onclick={addSwatch}
			oncontextmenu={(e) => {
				e.preventDefault();
				onResetSwatches?.();
			}}
			title="Save current color (Right-click to reset swatches)"
			class="h-6 w-6 rounded-md"
		>
			<Plus class="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
		</Button>
	</div>
</div>

<style>
	.checkerboard-bg {
		--checker-size: 8px;
	}
</style>
