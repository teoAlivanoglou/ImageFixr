<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { settings, appState } from '$lib/state.svelte';
	import { cn } from '$lib/utils';
	import { Undo } from '@lucide/svelte';

	let { class: className }: { class?: string } = $props();
</script>

<div class={cn('flex flex-col gap-4', className)}>
	<div class="control">
		<div class="control-header mb-1.5 flex items-center justify-between">
			<Label for="fg-blur">Foreground Blur Strength</Label>
			<span class="control-value font-mono text-muted-foreground">
				<Undo size="icon-sm" />
			</span>
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
		<div
			class="control-header mb-1.5 grid! grid-cols-[1fr_auto_auto] place-content-stretch place-items-stretch items-stretch"
		>
			<Label for="fg-scale" class="col-start-1">Foreground Scale</Label>

			{#if settings.current.fgScale !== 1}
				<button
					aria-label="Reset"
					onclick={() => {
						settings.current.fgScale = 1;
					}}
					class="col-start-2 flex cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
				>
					<Undo size={14} />
				</button>
			{/if}

			<span class="control-value col-start-3 font-mono text-muted-foreground">
				{appState.fgActualScale.toFixed(2)}x
			</span>
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
</div>
