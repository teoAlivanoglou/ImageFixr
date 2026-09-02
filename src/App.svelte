<script lang="ts">
	import './app.css';
	import Sidebar from '$lib/Sidebar.svelte';
	import Viewport from '$lib/Viewport.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { cn } from '$lib/utils';

	let { class: className }: { class?: string } = $props();

	let viewportRef = $state<Viewport>();
</script>

<div
	class={cn('grid h-dvh w-screen grid-cols-[320px_minmax(0,1fr)] grid-rows-[auto_1fr]', className)}
>
	<Navbar class="col-span-full" onExport={() => viewportRef?.renderAndSave()} />
	<Sidebar class="col-span-1 row-span-1 row-start-2" />
	<Viewport class="col-span-1 col-start-2 row-span-1 row-start-2 p-4" bind:this={viewportRef} />
</div>

<style>
	:global(.checkerboard) {
		background: repeating-conic-gradient(var(--background) 0 25%, var(--muted) 0 50%) 50% / 1.5em
			1.5em;
	}
	:global(.dark .checkerboard) {
		background: repeating-conic-gradient(var(--background) 0 25%, var(--card) 0 50%) 50% / 1.5em
			1.5em;
	}
</style>
