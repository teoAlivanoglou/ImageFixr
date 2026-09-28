<script lang="ts">
	import ForegroundControls from './components/Sidebar/ForegroundControls.svelte';
	import MarginControls from './components/Sidebar/MarginControls.svelte';
	import BorderControls from './components/Sidebar/BorderControls.svelte';
	import DropShadowControls from './components/Sidebar/DropShadowControls.svelte';
	import BackgroundControls from './components/Sidebar/BackgroundControls.svelte';
	import CanvasControls from './components/Sidebar/CanvasControls.svelte';
	import FormatControls from './components/Sidebar/FormatControls.svelte';
	import { layoutMode } from '$lib/viewport/layout-mode.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let asideEl = $state<HTMLElement | null>(null);
	let contentEl = $state<HTMLElement | null>(null);

	$effect(() => {
		if (!contentEl || !asideEl) return;

		let prevHeight = contentEl.scrollHeight;

		const observer = new ResizeObserver(() => {
			if (!asideEl || !contentEl) return;
			const currentHeight = contentEl.scrollHeight;
			if (currentHeight < prevHeight) {
				const maxScroll = Math.max(0, asideEl.scrollHeight - asideEl.clientHeight);
				if (asideEl.scrollTop > maxScroll) {
					asideEl.scrollTop = maxScroll;
				}
			}
			prevHeight = currentHeight;
		});

		observer.observe(contentEl);
		return () => observer.disconnect();
	});
</script>

<aside
	bind:this={asideEl}
	class={cn(
		'@container flex min-h-0 flex-1 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-4 [&_:is(label,span)]:font-light! [&_label]:text-sm!',
		className
	)}
>
	<div bind:this={contentEl} class="flex flex-col gap-3.5">
		<ForegroundControls />
		<BackgroundControls />
		<MarginControls />

		<BorderControls />
		<DropShadowControls />

		{#if layoutMode.current === 'mobile-landscape'}
			<FormatControls />
		{/if}

		{#if import.meta.env.DEV && layoutMode.current !== 'mobile-landscape'}
			<CanvasControls />
		{/if}
	</div>
</aside>
