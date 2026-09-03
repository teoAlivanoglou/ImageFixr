<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Undo } from '@lucide/svelte';

	let {
		id,
		label,
		value = $bindable(),
		min = 0,
		max = 100,
		step = 1,
		defaultValue = null,
		formatValue
	}: {
		id: string;
		label: string;
		value: number;
		min?: number;
		max?: number;
		step?: number;
		defaultValue?: number | null;
		formatValue?: (val: number) => string;
	} = $props();

	const formattedValue = $derived(
		formatValue ? formatValue(value) : String(value)
	);

	const canReset = $derived(
		defaultValue !== null && defaultValue !== undefined && value !== defaultValue
	);
</script>

<div class="control">
	<div class="control-header mb-1.5 flex items-center justify-between">
		<Label for={id}>{label}</Label>
		{#if canReset}
			<button
				aria-label="Reset value"
				onclick={() => {
					if (defaultValue !== null) value = defaultValue;
				}}
				class="group flex cursor-pointer items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
			>
				<Undo size={14} />
				<span class="control-value font-mono transition-colors group-hover:text-foreground!">{formattedValue}</span>
			</button>
		{:else}
			<span class="control-value font-mono text-muted-foreground">{formattedValue}</span>
		{/if}
	</div>
	<Slider {id} type="single" bind:value {min} {max} {step} />
</div>
