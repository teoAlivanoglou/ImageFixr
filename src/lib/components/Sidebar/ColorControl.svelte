<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import ColorPickerButton from './ColorPickerButton.svelte';
	import { cn } from '$lib/utils';

	let {
		id,
		label,
		value = $bindable(),
		class: className,
		buttonClass,
		ariaLabel
	}: {
		id?: string;
		label?: string;
		value: string;
		class?: string;
		buttonClass?: string;
		ariaLabel?: string;
	} = $props();
</script>

{#if label}
	<div class={cn('flex items-center justify-between gap-2', className)}>
		<Label for={id}>{label}</Label>
		<ColorPickerButton bind:value class={buttonClass} ariaLabel={ariaLabel ?? `${label} Color`} />
	</div>
{:else}
	<ColorPickerButton bind:value class={cn(buttonClass, className)} {ariaLabel} />
{/if}
