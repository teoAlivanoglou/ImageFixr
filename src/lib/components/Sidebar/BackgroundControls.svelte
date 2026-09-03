<script lang="ts">
	import SliderControl from './SliderControl.svelte';
	import { settings, appState } from '$lib/state.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-col gap-4', className)}>
	<SliderControl
		id="bg-blur"
		label="Background Blur Strength"
		bind:value={settings.current.bgBlur}
		min={0}
		max={100}
		step={1}
		defaultValue={100}
	/>

	<SliderControl
		id="bg-scale"
		label="Background Scale"
		bind:value={settings.current.bgScale}
		min={0}
		max={2}
		step={0.01}
		defaultValue={1}
		formatValue={() => `${appState.bgActualScale.toFixed(2)}x`}
	/>
</div>
