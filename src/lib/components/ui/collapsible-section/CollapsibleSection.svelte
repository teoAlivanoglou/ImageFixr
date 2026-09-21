<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		open = false,
		class: className,
		innerClass,
		children
	}: {
		open?: boolean;
		class?: string;
		innerClass?: string;
		children: Snippet;
	} = $props();
</script>

<div
	class={cn(
		'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
		open ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0',
		className
	)}
>
	<div class={cn('overflow-hidden', innerClass)}>
		{@render children()}
	</div>
</div>
