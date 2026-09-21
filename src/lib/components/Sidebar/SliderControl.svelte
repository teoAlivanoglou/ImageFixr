<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Undo } from '@lucide/svelte';
	import { commitHistory } from '$lib/state.svelte';

	let {
		id,
		label,
		value = $bindable(),
		min = 0,
		max = 100,
		step = 1,
		defaultValue = null,
		formatValue,
		onValueCommit
	}: {
		id: string;
		label: string;
		value: number;
		min?: number;
		max?: number;
		step?: number;
		defaultValue?: number | null;
		formatValue?: (val: number) => string;
		onValueCommit?: (val: number) => void;
	} = $props();

	const formattedValue = $derived(formatValue ? formatValue(value) : String(value));

	const canReset = $derived(
		defaultValue !== null && defaultValue !== undefined && value !== defaultValue
	);

	function handleCommit(val: number | number[]) {
		const num = Array.isArray(val) ? val[0] : val;
		if (onValueCommit) {
			onValueCommit(num);
		} else {
			commitHistory();
		}
	}
</script>

<div class="control">
	<div class="control-header mb-1.5 flex items-center justify-between">
		<Label for={id}>{label}</Label>
		{#if canReset}
			<button
				aria-label="Reset value"
				onclick={() => {
					if (defaultValue !== null) {
						value = defaultValue;
						commitHistory();
					}
				}}
				class="group flex cursor-pointer items-center gap-1.5"
			>
				<Undo
					size={14}
					class="text-muted-foreground transition-colors group-hover:text-foreground"
				/>
				<span class="control-value font-mono text-muted-foreground">
					{formattedValue}
				</span>
			</button>
		{:else}
			<span class="control-value font-mono text-muted-foreground">{formattedValue}</span>
		{/if}
	</div>
	<Slider
		{id}
		type="single"
		bind:value
		{min}
		{max}
		{step}
		onValueCommit={handleCommit}
	/>
</div>
