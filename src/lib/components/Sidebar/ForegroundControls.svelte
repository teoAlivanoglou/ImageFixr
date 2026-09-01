<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { settings, appState } from '$lib/state.svelte';
</script>

<!-- Foreground -->
<!-- <h3 class="text-md -mb-2 font-medium">Foreground</h3> -->

<div class="control">
	<div class="control-header mb-1.5 flex items-center justify-between">
		<Label for="fg-blur">Blur Strength</Label>
		<span class="control-value font-mono text-muted-foreground">{settings.current.fgBlur}</span>
	</div>
	<Slider
		id="fg-blur"
		type="single"
		bind:value={settings.current.fgBlur}
		min={0}
		max={100}
		step={1}
	/>
</div>

<div class="control">
	<div class="control-header mb-1.5 flex items-center justify-between">
		<Label for="fg-scale">Scale</Label>
		<span class="control-value font-mono text-muted-foreground"
			>{appState.fgActualScale.toFixed(2)}x</span
		>
	</div>
	<Slider
		id="fg-scale"
		type="single"
		bind:value={settings.current.fgScale}
		min={0}
		max={2}
		step={0.01}
	/>
</div>
