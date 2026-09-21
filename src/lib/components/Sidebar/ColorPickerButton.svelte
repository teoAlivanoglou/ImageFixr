<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ColorPicker } from '$lib/components/ui/color-picker';
	import { Palette } from '@lucide/svelte';
	import { settings, commitHistory } from '$lib/state.svelte';
	import { parseColorRgb } from '$lib/viewport/color-utils';
	import { cn } from '$lib/utils';

	let {
		value = $bindable(),
		swatches = $bindable(settings.current.swatches),
		onChange,
		onValueCommit,
		class: className,
		ariaLabel = 'Color picker'
	}: {
		value: string;
		swatches?: string[];
		onChange?: (value: string) => void;
		onValueCommit?: (value: string) => void;
		class?: string;
		ariaLabel?: string;
	} = $props();

	let iconColor = $derived.by(() => {
		const { r, g, b } = parseColorRgb(value);
		const lum = (r * 299 + g * 587 + b * 114) / 1000;
		return lum > 140 ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.45)';
	});

	function handleCommit(val: string) {
		if (onValueCommit) {
			onValueCommit(val);
		} else {
			commitHistory();
		}
	}
</script>

<Popover.Root onOpenChange={(open) => { if (!open) handleCommit(value); }}>
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
		<ColorPicker bind:value bind:swatches {onChange} onValueCommit={handleCommit} />
	</Popover.Content>
</Popover.Root>
