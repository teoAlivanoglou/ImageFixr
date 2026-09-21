<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ColorPicker } from '$lib/components/ui/color-picker';
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
		</Button>
	</Popover.Trigger>
	<Popover.Content side="right" align="end" class="border-none bg-transparent p-0 shadow-none">
		<ColorPicker bind:value bind:swatches onChange={handleChange} />
	</Popover.Content>
</Popover.Root>
