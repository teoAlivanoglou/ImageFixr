<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { settings, appState } from '$lib/state.svelte';
</script>

<!-- Background -->
<!-- <h3 class="text-md -mb-2 font-medium">Background</h3> -->

<div class="control">
	<div class="control-header mb-1.5 flex items-center justify-between">
		<Label for="bg-blur">Background Blur Strength</Label>

		<span class="control-value font-mono text-muted-foreground">
			{settings.current.bgBlur}
		</span>
	</div>
	<Slider
		id="bg-blur"
		type="single"
		bind:value={settings.current.bgBlur}
		min={0}
		max={100}
		step={1}
	/>
</div>

<div class="control">
	<div class="control-header mb-1.5 flex items-center justify-between">
		<Label for="bg-scale">Background Scale</Label>
		<span class="control-value font-mono text-muted-foreground">
			{appState.bgActualScale.toFixed(2)}x
		</span>
	</div>
	<Slider
		id="bg-scale"
		type="single"
		bind:value={settings.current.bgScale}
		min={0}
		max={2}
		step={0.01}
	/>
</div>
