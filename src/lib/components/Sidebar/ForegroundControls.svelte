<script lang="ts">
	import SliderControl from './SliderControl.svelte';
	import { settings, appState } from '$lib/state.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-col gap-4', className)}>
	<SliderControl
		id="fg-blur"
		label="Foreground Blur Strength"
		bind:value={settings.current.fgBlur}
		min={0}
		max={100}
		step={1}
		defaultValue={0}
	/>

	<SliderControl
		id="fg-scale"
		label="Foreground Scale"
		bind:value={settings.current.fgScale}
		min={0}
		max={2}
		step={0.01}
		defaultValue={1}
		formatValue={() => `${appState.fgActualScale.toFixed(2)}x`}
	/>
</div>
