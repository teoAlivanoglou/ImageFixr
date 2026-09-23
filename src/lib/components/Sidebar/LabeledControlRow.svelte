<script lang="ts">
	import type { Snippet } from 'svelte';
	import { useLabelGroup } from './label-group.svelte';
	import { cn } from '$lib/utils';

	let {
		label,
		forId,
		class: className,
		children
	}: {
		label: string;
		forId?: string;
		class?: string;
		children: Snippet;
	} = $props();

	const group = useLabelGroup();
	const id = Math.random().toString(36).substring(2, 9);
	let textSpanEl = $state<HTMLElement | null>(null);

	$effect(() => {
		if (group && textSpanEl) {
			const reg = group.register(id, textSpanEl);
			return () => reg.destroy();
		}
	});
</script>

<div class={cn('flex items-center gap-3', className)}>
	<label
		for={forId}
		class="shrink-0 text-xs font-medium text-muted-foreground"
		style={group && group.maxWidth > 0 ? `width: ${group.maxWidth}px;` : undefined}
	>
		<span bind:this={textSpanEl} class="inline-block whitespace-nowrap">
			{label}
		</span>
	</label>
	<div class="flex-1 min-w-0">
		{@render children()}
	</div>
</div>
