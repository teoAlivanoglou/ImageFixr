<script lang="ts">
	import { cn } from '$lib/utils';
	import { getContext, type Snippet } from 'svelte';

	const contextCollapsible = getContext<boolean | undefined>('collapsible');

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

	let isOpen = $derived(contextCollapsible === false ? true : open);
</script>

<div
	class={cn(
		'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
		isOpen ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0',
		className
	)}
>
	<div class={cn('overflow-hidden', innerClass)}>
		{@render children()}
	</div>
</div>
