<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ColorPicker } from '$lib/components/ui/color-picker';
	import { Palette } from '@lucide/svelte';
	import { settings, commitHistory } from '$lib/state.svelte';
	import { cn } from '$lib/utils';

	let {
		value = $bindable(),
		swatches = $bindable(settings.current.swatches),
		onChange,
		class: className,
		ariaLabel = 'Color picker'
	}: {
		value: string;
		swatches?: string[];
		onChange?: (value: string) => void;
		class?: string;
		ariaLabel?: string;
	} = $props();

	function parseColorRgb(color: string): { r: number; g: number; b: number } {
		if (!color) return { r: 0, g: 0, b: 0 };
		const str = color.trim();
		if (str.startsWith('#')) {
			const raw = str.slice(1);
			if (raw.length === 3 || raw.length === 4) {
				return {
					r: parseInt(raw[0] + raw[0], 16),
					g: parseInt(raw[1] + raw[1], 16),
					b: parseInt(raw[2] + raw[2], 16)
				};
			}
			if (raw.length >= 6) {
				return {
					r: parseInt(raw.slice(0, 2), 16),
					g: parseInt(raw.slice(2, 4), 16),
					b: parseInt(raw.slice(4, 6), 16)
				};
			}
		}
		const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
		if (rgbMatch) {
			return {
				r: parseInt(rgbMatch[1], 10),
				g: parseInt(rgbMatch[2], 10),
				b: parseInt(rgbMatch[3], 10)
			};
		}
		return { r: 0, g: 0, b: 0 };
	}

	let iconColor = $derived.by(() => {
		const { r, g, b } = parseColorRgb(value);
		const lum = (r * 299 + g * 587 + b * 114) / 1000;
		return lum > 140 ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.45)';
	});

	function handleChange(val: string) {
		if (onChange) {
			onChange(val);
		} else {
			commitHistory();
		}
	}
</script>

<Popover.Root>
	<Popover.Trigger>
		<Button
			variant="outline"
			class={cn('relative h-8 w-14 shrink-0 overflow-hidden p-0', className)}
			aria-label={ariaLabel}
		>
			<span
				class="absolute inset-0 bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] [background-size:8px_8px] opacity-20"
			></span>
			<span class="absolute inset-0" style={`background-color: ${value}`}></span>
			<span class="relative z-10 flex h-full w-full items-center justify-center">
				<Palette
					strokeWidth={2}
					class="size-5 transition-colors duration-150"
					style={`color: ${iconColor}`}
				/>
			</span>
		</Button>
	</Popover.Trigger>
	<Popover.Content side="right" align="end" class="border-none bg-transparent p-0 shadow-none">
		<ColorPicker bind:value bind:swatches onChange={handleChange} />
	</Popover.Content>
</Popover.Root>
